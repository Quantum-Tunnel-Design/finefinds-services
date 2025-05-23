import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { BullModule } from '@nestjs/bull';
import { NotificationProcessor } from './notification.processor';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
    UsersModule,
  ],
  providers: [NotificationsService, NotificationsResolver, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {} 