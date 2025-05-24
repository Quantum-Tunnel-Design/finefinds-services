import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersResolver } from './admin-users.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // For guards
import { UsersModule } from '../users/users.module';
import { ExcelExportService } from './services/excel-export.service';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  providers: [AdminService, AdminResolver, AdminUsersService, AdminUsersResolver, ExcelExportService],
  exports: [AdminService],
})
export class AdminModule {} 