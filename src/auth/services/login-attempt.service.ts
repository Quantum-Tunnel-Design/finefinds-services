import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class LoginAttemptService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(private prisma: PrismaService) {}

  async recordFailedAttempt(email: string): Promise<{ attemptsLeft: number; lockedUntil?: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== UserRole.VENDOR) {
      return { attemptsLeft: 0 };
    }

    // Get recent failed attempts
    const recentAttempts = await this.prisma.loginAttempt.findMany({
      where: {
        userId: user.id,
        success: false,
        createdAt: {
          gt: new Date(Date.now() - this.LOCKOUT_DURATION),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentAttempts.length >= this.MAX_ATTEMPTS) {
      const lockoutEnd = new Date(recentAttempts[0].createdAt.getTime() + this.LOCKOUT_DURATION);
      return { attemptsLeft: 0, lockedUntil: lockoutEnd };
    }

    // Record new failed attempt
    await this.prisma.loginAttempt.create({
      data: {
        success: false,
        ipAddress: '0.0.0.0', // Replace with actual IP address if available
        userAgent: 'Unknown', // Replace with actual user agent if available
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return { attemptsLeft: this.MAX_ATTEMPTS - (recentAttempts.length + 1) };
  }

  async clearFailedAttempts(userId: string): Promise<void> {
    await this.prisma.loginAttempt.deleteMany({
      where: { userId },
    });
  }

  async isAccountLocked(email: string): Promise<{ locked: boolean; lockedUntil?: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== UserRole.VENDOR) {
      return { locked: false };
    }

    const recentAttempts = await this.prisma.loginAttempt.findMany({
      where: {
        userId: user.id,
        success: false,
        createdAt: {
          gt: new Date(Date.now() - this.LOCKOUT_DURATION),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentAttempts.length >= this.MAX_ATTEMPTS) {
      const lockoutEnd = new Date(recentAttempts[0].createdAt.getTime() + this.LOCKOUT_DURATION);
      return { locked: true, lockedUntil: lockoutEnd };
    }

    return { locked: false };
  }
} 