import { Module } from '@nestjs/common';
import { ClassPackagesService } from './class-packages.service';
// import { ClassPackagesController } from './class-packages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ClassPackagesResolver } from './class-packages.resolver';

@Module({
  imports: [PrismaModule, S3Module, AuthModule, AuditModule],
  // controllers: [ClassPackagesController],
  providers: [ClassPackagesService, ClassPackagesResolver],
  exports: [ClassPackagesService],
})
export class ClassPackagesModule {} 