import { Module } from '@nestjs/common';
import { SavedClassPackagesService } from './saved-class-packages.service';
import { SavedClassPackagesController } from './saved-class-packages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // For guards and decorators

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SavedClassPackagesController],
  providers: [SavedClassPackagesService],
})
export class SavedClassPackagesModule {} 