import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, AuditLogAction, AuditLogEntityType } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logProfileUpdate(
    userId: string,
    entityId: string,
    previousValues: any,
    updatedValues: any,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: AuditLogAction.UPDATE,
        entityType: AuditLogEntityType.BUSINESS_PROFILE,
        entityId,
        previousValues,
        changes: updatedValues,
      },
    });
  }

  async logProfileDeletion(
    userId: string,
    entityId: string,
    deletedData: any,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: AuditLogAction.DELETE,
        entityType: AuditLogEntityType.BUSINESS_PROFILE,
        entityId,
        changes: {},
        previousValues: deletedData,
      },
    });
  }
} 