import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Notification as PrismaNotification } from '@prisma/client';
import { CreateNotificationInput } from './dto/create-notification.input';
import { Notification } from './models/notification.model';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async sendNotification(
    userId: string,
    type: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.notificationsQueue.add(
        'send-notification',
        {
          userId,
          type,
          message,
          data,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue notification: ${error.message}`, error.stack);
    }
  }

  async sendEmailNotification(
    email: string,
    subject: string,
    template: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.notificationsQueue.add(
        'send-email',
        {
          email,
          subject,
          template,
          data,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue email notification: ${error.message}`, error.stack);
    }
  }

  async sendPushNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.notificationsQueue.add(
        'send-push',
        {
          deviceToken,
          title,
          body,
          data,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue push notification: ${error.message}`, error.stack);
    }
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    
    return notifications.map(notification => ({
      ...notification,
      title: notification.type,
      data: {},
    }));
  }

  async createNotification(userId: string, input: CreateNotificationInput): Promise<PrismaNotification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        ...input,
      },
    });

    return notification;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<PrismaNotification> {
    const notification = await this.prisma.notification.update({
      where: { id, userId },
      data: { read: true },
    });

    return notification;
  }
}
