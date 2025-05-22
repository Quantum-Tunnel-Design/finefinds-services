import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { S3Module } from '../s3/s3.module';
import { AuthModule } from '../auth/auth.module'; // For JwtAuthGuard and CurrentUser decorator
import { ConfigModule } from '@nestjs/config'; // If ConfigService is used in UploadsService

@Module({
  imports: [S3Module, AuthModule, ConfigModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService], // Export if other modules will use it directly
})
export class UploadsModule {} 