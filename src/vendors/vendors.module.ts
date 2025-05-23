import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsResolver } from './vendors.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    S3Module,
    AuditModule,
    UsersModule,
  ],
  providers: [VendorsService, VendorsResolver],
  exports: [VendorsService],
})
export class VendorsModule {} 