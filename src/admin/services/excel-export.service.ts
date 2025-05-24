import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { AdminUserListViewDto } from '../dto/admin-user-list-view.dto';
import { UserRole } from '@prisma/client';
import { DashboardMetricsDto } from '../dto/dashboard-metrics.dto';
import { AdminTransactionListViewDto } from '../dto/admin-transaction-list-view.dto';
import { MonthlyPaymentDataDto } from '../dto/monthly-payment-data.dto';

@Injectable()
export class ExcelExportService {
  generateUserListExcel(users: AdminUserListViewDto[], role?: UserRole): Buffer {
    // Prepare worksheet data
    const worksheetData = users.map(user => ({
      'User ID': user.userId,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      'Email': user.email,
      'Phone Number': user.phoneNumber,
      'Secondary Phone': user.secondaryPhoneNumber || '',
      'Email Verified': user.isEmailVerified ? 'Yes' : 'No',
      'Active': user.isActive ? 'Yes' : 'No',
      'Terms Accepted': user.termsAccepted ? 'Yes' : 'No',
      'Created At': user.createdAt.toLocaleString(),
      'Updated At': user.updatedAt.toLocaleString(),
      ...(role === UserRole.VENDOR && {
        'Business Name': user.businessName || '',
        'Business Description': user.businessDescription || '',
      }),
      ...(role === UserRole.PARENT && {
        'Children Count': user.childrenCount || 0,
      }),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Set column widths
    const columnWidths = {
      'A': 15, // User ID
      'B': 15, // First Name
      'C': 15, // Last Name
      'D': 30, // Email
      'E': 15, // Phone Number
      'F': 15, // Secondary Phone
      'G': 12, // Email Verified
      'H': 10, // Active
      'I': 15, // Terms Accepted
      'J': 20, // Created At
      'K': 20, // Updated At
      ...(role === UserRole.VENDOR && {
        'L': 25, // Business Name
        'M': 40, // Business Description
      }),
      ...(role === UserRole.PARENT && {
        'L': 15, // Children Count
      }),
    };

    worksheet['!cols'] = Object.values(columnWidths).map(width => ({ width }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }

  generateMetricsExcel(metrics: DashboardMetricsDto): Buffer {
    const worksheetData = [
      {
        'Metric': 'Total Online Payments',
        'Value': `$${metrics.onlinePaymentsTotal.toFixed(2)}`,
      },
      {
        'Metric': 'Total Number of Payments',
        'Value': metrics.totalPayments,
      },
      {
        'Metric': 'Total Users',
        'Value': metrics.totalUsers,
      },
      {
        'Metric': 'Parents Registered',
        'Value': metrics.parentsRegistered,
      },
      {
        'Metric': 'Vendors Registered',
        'Value': metrics.vendorsRegistered,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { width: 25 }, // Metric column
      { width: 20 }, // Value column
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard Metrics');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  generateTransactionsExcel(transactions: AdminTransactionListViewDto[]): Buffer {
    const worksheetData = transactions.map(transaction => ({
      'Transaction ID': transaction.id,
      'Gateway Transaction ID': transaction.gatewayTransactionId,
      'Payment Date': transaction.paymentDate.toLocaleString(),
      'Parent ID': transaction.parentId,
      'Parent Name': transaction.parentName,
      'Vendor ID': transaction.vendorId,
      'Vendor Name': transaction.vendorName,
      'Class Package ID': transaction.classPackageId,
      'Class Package Name': transaction.classPackageName,
      'Amount': `$${transaction.amount.toFixed(2)}`,
      'Payment Method': transaction.paymentMethod,
      'Status': transaction.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { width: 15 }, // Transaction ID
      { width: 20 }, // Gateway Transaction ID
      { width: 20 }, // Payment Date
      { width: 15 }, // Parent ID
      { width: 25 }, // Parent Name
      { width: 15 }, // Vendor ID
      { width: 25 }, // Vendor Name
      { width: 15 }, // Class Package ID
      { width: 30 }, // Class Package Name
      { width: 15 }, // Amount
      { width: 15 }, // Payment Method
      { width: 15 }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  generatePaymentChartExcel(monthlyPayments: MonthlyPaymentDataDto[]): Buffer {
    const worksheetData = monthlyPayments.map(payment => ({
      'Month': payment.month,
      'Total Amount': `$${payment.totalAmount.toFixed(2)}`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    worksheet['!cols'] = [
      { width: 15 }, // Month
      { width: 20 }, // Total Amount
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Payments');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
} 