import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // For guards

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AdminService, AdminResolver],
})
export class AdminModule {} 