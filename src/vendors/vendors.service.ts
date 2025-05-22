import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import { User, UserRole } from '@prisma/client';
import { CreateBusinessProfileInput } from './dto/create-business-profile.input';
import { UpdateBusinessProfileInput } from './dto/update-business-profile.input';
import { DeleteBusinessProfileInput } from './dto/delete-business-profile.input';
import { S3Service } from '../s3/s3.service';
import { AuditService } from '../audit/audit.service';
import { DateRangeFilterDto } from '../admin/dto/date-range-filter.dto';
import { VendorDashboardDataDto } from './dto/vendor-dashboard-data.dto';
import { VendorRevenueMetricsDto } from './dto/vendor-revenue-metrics.dto';
import { MonthlyPaymentDataDto } from '../admin/dto/monthly-payment-data.dto';
import { PaymentStatus, Prisma, BookingStatus, ClassPackageStatus } from '@prisma/client';
import { BusinessProfile } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private auditService: AuditService,
  ) {}

  /**
   * Creates or updates a vendor profile for a user
   */
  async createOrUpdateVendorProfile(
    userId: string,
    dto: CreateVendorProfileDto | UpdateVendorProfileDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('Only vendors can create vendor profiles');
    }

    return this.prisma.vendorProfile.upsert({
      where: { userId },
      update: dto,
      create: {
        ...(dto as CreateVendorProfileDto),
        userId,
      },
      include: { user: true },
    });
  }

  /**
   * Gets the vendor profile for the current user
   */
  async getMyVendorProfile(userId: string) {
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Vendor profile not found');
    }

    return profile;
  }

  /**
   * Lists all vendor profiles (admin only)
   */
  async listVendorProfiles(currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can list all vendor profiles');
    }

    return this.prisma.vendorProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approves a vendor profile (admin only)
   */
  async approveVendor(vendorId: string, adminUser: User) {
    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can approve vendors.');
    }
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });
    if (!vendorProfile) {
      throw new NotFoundException(`Vendor profile with ID ${vendorId} not found.`);
    }
    return this.prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { approved: true },
      include: {user: true}
    });
  }

  async getBusinessProfileByUserId(userId: string): Promise<BusinessProfile | null> {
    return this.prisma.businessProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async createBusinessProfile(userId: string, input: CreateBusinessProfileInput): Promise<BusinessProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { businessProfile: true },
    });

    if (!user || user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('Only vendors can create business profiles');
    }

    if (user.businessProfile) {
      throw new BadRequestException('Business profile already exists');
    }

    return this.prisma.businessProfile.create({
      data: {
        userId,
        businessName: input.businessName,
        location: input.location,
        description: input.description,
        contactNumber: input.contactNumber,
        website: input.website,
        facebookUrl: input.facebookUrl,
        instagramUrl: input.instagramUrl,
        twitterUrl: input.twitterUrl,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        branch: input.branch,
        logoUrl: input.logoUrl,
        coverImageUrl: input.coverImageUrl,
        galleryUrls: input.galleryUrls,
        categories: input.categories,
        tags: input.tags,
      },
    });
  }

  async updateBusinessProfile(userId: string, input: UpdateBusinessProfileInput): Promise<BusinessProfile> {
    const currentProfile = await this.prisma.businessProfile.findUnique({
      where: { userId },
    });

    if (!currentProfile) {
      throw new NotFoundException('Business profile not found');
    }

    const updateData: Prisma.BusinessProfileUpdateInput = {
      businessName: input.businessName,
      location: input.location,
      description: input.description,
      contactNumber: input.contactNumber,
      website: input.website,
      facebookUrl: input.facebookUrl,
      instagramUrl: input.instagramUrl,
      twitterUrl: input.twitterUrl,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      branch: input.branch,
      logoUrl: input.logoUrl,
      coverImageUrl: input.coverImageUrl,
      galleryUrls: input.galleryUrls,
      categories: input.categories,
      tags: input.tags,
    };
    
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const previousValues = { ...currentProfile };

    const updatedProfile = await this.prisma.businessProfile.update({
      where: { userId },
      data: updateData,
    });

    await this.auditService.logProfileUpdate(
      userId,
      updatedProfile.id,
      updateData,
      previousValues,
    );

    return updatedProfile;
  }

  async deleteBusinessProfile(userId: string, input: DeleteBusinessProfileInput) {
    const currentProfile = await this.prisma.businessProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            createdClassPackages: {
              include: {
                enrollments: true,
                scheduleSlots: true,
              },
            },
          },
        },
      },
    });

    if (!currentProfile) {
      throw new NotFoundException('Business profile not found');
    }

    const hasActiveEnrollments = currentProfile.user.createdClassPackages.some(pkg => 
      pkg.enrollments.some(enrollment => enrollment.bookingStatus === BookingStatus.PAID)
    );

    if (hasActiveEnrollments) {
      throw new ForbiddenException(
        'Cannot delete profile while there are scheduled classes with active enrollments'
      );
    }

    await this.prisma.classPackage.updateMany({
      where: { vendorId: userId, status: { not: ClassPackageStatus.ARCHIVED } },
      data: { status: ClassPackageStatus.ARCHIVED },
    });

    const profileDataForAudit = { ...currentProfile };
    delete profileDataForAudit.user;

    await this.prisma.businessProfile.delete({
      where: { userId },
    });

    await this.auditService.logProfileDeletion(
      userId,
      currentProfile.id,
      profileDataForAudit
    );

    return { message: 'Business profile deleted successfully' };
  }

  async getVendorDashboardData(
    vendorId: string,
    filters?: DateRangeFilterDto,
  ): Promise<VendorDashboardDataDto> {
    const vendor = await this.prisma.user.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new NotFoundException('Vendor not found or user is not a vendor.');
    }

    // 1. Calculate Pending Payout (To-Date)
    const pendingPayoutAggregation = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.COMPLETED,
        isPaidOutToVendor: false,
        classPackageEnrollment: {
          classPackage: {
            vendorId: vendorId,
          },
        },
      },
    });
    const pendingPayoutToDate = pendingPayoutAggregation._sum.amount || 0;

    // 2. Calculate Total Payments (In Range)
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters?.startDate) {
      dateFilter.gte = new Date(filters.startDate);
    }
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    const totalPaymentsInRangeAggregation = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        classPackageEnrollment: {
          classPackage: {
            vendorId: vendorId,
          },
        },
      },
    });
    const totalPaymentsInRange = totalPaymentsInRangeAggregation._sum.amount || 0;

    const metrics: VendorRevenueMetricsDto = {
      pendingPayoutToDate,
      totalPaymentsInRange,
    };

    // 3. Monthly Payment Data for Graph
    const startDateString = filters?.startDate ? new Date(filters.startDate).toISOString() : new Date(0).toISOString();
    const endDateString = filters?.endDate
        ? new Date(new Date(filters.endDate).setHours(23, 59, 59, 999)).toISOString()
        : new Date().toISOString();

    const monthlyPaymentsRaw: { year_month: string; total_amount: number }[] = await this.prisma.$queryRaw`
      SELECT
          to_char(p."createdAt", 'YYYY-MM') as year_month,
          SUM(p.amount) as total_amount
      FROM "Payment" p
      INNER JOIN "ClassPackageEnrollment" cpe ON p."classPackageEnrollmentId" = cpe.id
      INNER JOIN "ClassPackage" cp ON cpe."classPackageId" = cp.id
      WHERE p.status = 'COMPLETED'
      AND cp."vendorId" = ${vendorId}
      AND p."createdAt" >= ${new Date(startDateString)}::timestamp
      AND p."createdAt" <= ${new Date(endDateString)}::timestamp
      GROUP BY year_month
      ORDER BY year_month ASC;
    `;
    
    const monthlyPayments: MonthlyPaymentDataDto[] = monthlyPaymentsRaw.map(item => ({
        month: item.year_month,
        totalAmount: Number(item.total_amount) || 0,
    }));

    return {
      metrics,
      monthlyPayments,
    };
  }
} 