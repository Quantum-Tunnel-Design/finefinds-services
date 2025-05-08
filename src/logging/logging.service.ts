import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log } from './schemas/log.schema';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
  ) {}

  async log(userId: string, event: string, payload?: Record<string, any>): Promise<void> {
    try {
      const log = new this.logModel({
        userId,
        event,
        payload,
        timestamp: new Date(),
      });

      await log.save();
      this.logger.log(`Event logged: ${event} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to log event: ${event}`, error.stack);
    }
  }

  async getLogs(userId: string, limit = 100): Promise<Log[]> {
    return this.logModel
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async getLogsByEvent(event: string, limit = 100): Promise<Log[]> {
    return this.logModel
      .find({ event })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
} 