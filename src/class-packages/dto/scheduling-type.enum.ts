import { registerEnumType } from '@nestjs/graphql';

export enum SchedulingType {
  FIXED_SLOTS = 'FIXED_SLOTS',
  CUSTOM_DATES = 'CUSTOM_DATES',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

registerEnumType(SchedulingType, {
  name: 'SchedulingType',
  description: 'Defines the type of scheduling for a class package.',
}); 