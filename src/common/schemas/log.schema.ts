import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const LogSchema = SchemaFactory.createForClass(Log);

// Indexes for better query performance
LogSchema.index({ userId: 1, createdAt: -1 });
LogSchema.index({ eventType: 1, createdAt: -1 }); 