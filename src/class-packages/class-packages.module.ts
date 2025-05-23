import { Module } from '@nestjs/common';
import { ClassPackagesService } from './class-packages.service';
// import { ClassPackagesController } from './class-packages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { ClassPackagesResolver } from './class-packages.resolver';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, S3Module, AuthModule, AuditModule, UsersModule],
  // controllers: [ClassPackagesController],
  providers: [ClassPackagesService, ClassPackagesResolver],
  exports: [ClassPackagesService],
})
export class ClassPackagesModule {} 