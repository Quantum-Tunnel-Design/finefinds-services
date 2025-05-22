import { Module } from '@nestjs/common';
import { SavedClassPackagesService } from './saved-class-packages.service';
import { SavedClassPackagesResolver } from './saved-class-packages.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SavedClassPackagesService, SavedClassPackagesResolver],
  exports: [SavedClassPackagesService],
})
export class SavedClassPackagesModule {} 