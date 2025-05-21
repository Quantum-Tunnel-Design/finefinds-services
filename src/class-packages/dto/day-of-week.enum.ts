import { registerEnumType } from '@nestjs/graphql';

export enum DayOfWeek {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

registerEnumType(DayOfWeek, {
  name: 'DayOfWeek',
  description: 'Represents a day of the week.',
}); 