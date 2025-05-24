import { Module } from '@nestjs/common';
import { VendorProfileService } from './vendor-profile.service';
import { VendorProfileResolver } from './vendor-profile.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [VendorProfileService, VendorProfileResolver],
  exports: [VendorProfileService],
})
export class VendorProfileModule {} 