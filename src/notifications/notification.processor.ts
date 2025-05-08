import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @Process('send-notification')
  async handleNotification(job: Job) {
    try {
      const { userId, type, message, data } = job.data;

      await this.prisma.notification.create({
        data: {
          userId,
          type,
          message,
        },
      });

      this.logger.log(`Notification sent to user ${userId}: ${message}`);
    } catch (error) {
      this.logger.error(`Failed to process notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('send-email')
  async handleEmail(job: Job) {
    try {
      const { email, subject, template, data } = job.data;

      // TODO: Implement email sending logic using AWS SES or other email service
      this.logger.log(`Email sent to ${email}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to process email: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('send-push')
  async handlePush(job: Job) {
    try {
      const { deviceToken, title, body, data } = job.data;

      // TODO: Implement push notification logic using Firebase Cloud Messaging
      this.logger.log(`Push notification sent to device ${deviceToken}: ${title}`);
    } catch (error) {
      this.logger.error(`Failed to process push notification: ${error.message}`, error.stack);
      throw error;
    }
  }
} 