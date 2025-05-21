import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  async createSession(userId: string, token: string, expiresAt: Date) {
    return this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async getSession(token: string) {
    return this.prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async deleteSession(token: string) {
    return this.prisma.session.deleteMany({
      where: {
        token,
      },
    });
  }

  async deleteUserSessions(userId: string) {
    return this.prisma.session.deleteMany({
      where: {
        userId,
      },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions() {
    return this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
} 