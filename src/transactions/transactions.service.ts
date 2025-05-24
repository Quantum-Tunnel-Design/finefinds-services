import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionViewDto } from './dto/transaction-view.dto';
import { PaymentStatus, UserRole } from '@prisma/client';
import PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Response } from 'express';
import { join } from 'path';

// Define fonts (adjust path as necessary, assuming fonts are in a public/fonts directory)
const fonts = {
  Roboto: {
    normal: join(__dirname, '../../public', 'fonts', 'Roboto-Regular.ttf'),
    bold: join(__dirname, '../../public', 'fonts', 'Roboto-Medium.ttf'),
    italics: join(__dirname, '../../public', 'fonts', 'Roboto-Italic.ttf'),
    bolditalics: join(__dirname, '../../public', 'fonts', 'Roboto-MediumItalic.ttf'),
  },
};

@Injectable()
export class TransactionsService {
  private printer: PdfPrinter;

  constructor(private prisma: PrismaService) {
    this.printer = new PdfPrinter(fonts);
  }

  async getParentTransactionHistory(userId: string): Promise<TransactionViewDto[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Access denied.');
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        userId: userId,
        status: PaymentStatus.COMPLETED, // Only show completed transactions
      },
      include: {
        classPackageEnrollment: {
          include: {
            classPackage: {
              include: {
                vendor: {
                  include: {
                    vendorProfile: true,
                  },
                },
                category: true,
              }
            },
            scheduleSlot: true,
            enrolledChildren: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return payments.map(payment => {
      const enrollment = payment.classPackageEnrollment;
      const classPackage = enrollment?.classPackage;
      const scheduleSlot = enrollment?.scheduleSlot;
      const vendor = classPackage?.vendor;
      const vendorProfile = vendor?.vendorProfile;

      let scheduleDetails = 'N/A';
      if (scheduleSlot) {
        const startTime = new Date(scheduleSlot.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(scheduleSlot.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const startDate = new Date(scheduleSlot.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        scheduleDetails = `${startDate}, ${startTime} - ${endTime}`;
      }

      return {
        id: payment.id,
        paymentDate: payment.createdAt,
        className: classPackage?.name || 'N/A',
        scheduleDetails: scheduleDetails,
        paymentAmount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.status,
        transactionId: payment.transactionId,
        classPackageId: classPackage?.id || 'N/A',
        vendorName: vendorProfile?.businessName || `${vendor?.firstName} ${vendor?.lastName}` || 'N/A',
      };
    });
  }

  async generateInvoicePdf(userId: string, paymentId: string, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.PARENT) {
      throw new ForbiddenException('Access denied.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        User: true,
        classPackageEnrollment: {
          include: {
            classPackage: {
              include: {
                vendor: {
                  include: { vendorProfile: true }
                },
                category: true,
              }
            },
            scheduleSlot: true,
            enrolledChildren: true,
          }
        }
      }
    });

    if (!payment || payment.userId !== userId) {
      throw new NotFoundException('Transaction not found or access denied.');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Invoice can only be generated for completed payments');
    }

    const enrollment = payment.classPackageEnrollment;
    const classPackage = enrollment?.classPackage;
    const scheduleSlot = enrollment?.scheduleSlot;
    const vendor = classPackage?.vendor;
    const vendorProfile = vendor?.vendorProfile;
    const parent = payment.User;

    const companyName = 'FineFinds Inc.'; // Replace with actual company name
    const companyAddress = '123 Learning Lane, Education City, ED 12345'; // Replace with actual address
    const companyContact = 'contact@finefinds.com | (555) 123-4567'; // Replace with actual contact

    const currencySymbol = 'Rs.'; // Using Rs. for LKR invoices

    let scheduleInfo = 'Not Applicable';
    if (scheduleSlot) {
      const startTime = new Date(scheduleSlot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const endTime = new Date(scheduleSlot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const startDate = new Date(scheduleSlot.startTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      scheduleInfo = `${startDate} from ${startTime} to ${endTime}`;
    }
    
    const childrenDetails = enrollment?.enrolledChildren.map(child => {
      return `${child.firstName} ${child.lastName}`;
    }).join(', ') || 'N/A';

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'INVOICE', style: 'header', alignment: 'center' },
        { text: `Invoice #: ${payment.transactionId || payment.id}`, alignment: 'right', margin: [0, 0, 0, 5] }, 
        { text: `Date: ${new Date(payment.createdAt).toLocaleDateString()}`, alignment: 'right', margin: [0, 0, 0, 20] },

        { text: companyName, style: 'subheader' },
        { text: companyAddress },
        { text: companyContact, margin: [0, 0, 0, 20] },

        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Bill To:\n', style: 'subheader' },
                `${parent?.firstName} ${parent?.lastName}\n`,
                `${parent?.email}`,
              ]
            },
            {
              width: '*',
              text: [
                { text: 'Vendor Details:\n', style: 'subheader' },
                `${vendorProfile?.businessName || (vendor ? `${vendor.firstName} ${vendor.lastName}` : 'N/A')}\n`,
                `${vendorProfile?.location || 'N/A'}\n`,
                `${vendorProfile?.contactNumber || vendor?.phoneNumber || 'N/A'}`,
              ],
              alignment: 'right'
            }
          ],
          margin: [0,0,0,20]
        },

        { text: 'Order Summary', style: 'subheader', margin: [0, 10, 0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [{ text: 'Description', style: 'tableHeader' }, { text: 'Quantity', style: 'tableHeader' }, { text: 'Unit Price', style: 'tableHeader' }, { text: 'Total', style: 'tableHeader' }],
              [
                {
                  stack: [
                    { text: classPackage?.name || 'Class Package', bold: true },
                    { text: `Category: ${classPackage?.category?.name || 'N/A'}`, fontSize: 9 },
                    { text: `Schedule: ${scheduleInfo}`, fontSize: 9 },
                    { text: `Children: ${childrenDetails}`, fontSize: 9 },
                  ]
                },
                enrollment?.enrolledChildren.length || 1, 
                `${currencySymbol} ${(classPackage?.pricePerChild || 0).toFixed(2)}`,
                `${currencySymbol} ${payment.amount.toFixed(2)}`,
              ]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },
        
        {
          columns: [
            {width: '*', text: ''}, // Empty column for spacing
            {
              width: 'auto',
              table: {
                body: [
                  [ {text: 'Subtotal', style: 'boldText'}, {text: `${currencySymbol} ${payment.amount.toFixed(2)}`, alignment: 'right'} ],
                  [ {text: 'Tax (0%)', style: 'boldText'}, {text: `${currencySymbol} 0.00`, alignment: 'right'} ], // Assuming no tax for now
                  [ {text: 'Total Amount Due', style: 'totalAmount'}, {text: `${currencySymbol} ${payment.amount.toFixed(2)}`, style: 'totalAmount', alignment: 'right'} ]
                ]
              },
              layout: 'noBorders'
            }
          ],
          margin: [0,0,0,30]
        },

        { text: 'Payment Details', style: 'subheader', margin: [0, 10, 0, 5] },
        `Payment Method: ${payment.paymentMethod || 'N/A'}`,
        `Transaction ID: ${payment.transactionId || 'N/A'}`,
        `Payment Status: ${payment.status}`,

        { text: 'Thank you for your business!', style: 'subheader', alignment: 'center', margin: [0, 40, 0, 0] },
      ],
      styles: {
        header: { fontSize: 22, bold: true, margin: [0, 0, 0, 20] },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        tableHeader: { bold: true, fontSize: 12, color: 'black' },
        boldText: { bold: true },
        totalAmount: { bold: true, fontSize: 14 }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };

    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${payment.id}.pdf`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  }
} 