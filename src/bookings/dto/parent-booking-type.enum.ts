import { registerEnumType } from '@nestjs/graphql';

export enum ParentBookingType {
  UPCOMING = 'upcoming',
  PAST = 'past',
}

registerEnumType(ParentBookingType, {
  name: 'ParentBookingType',
  description: "Filter for 'upcoming' or 'past' parent bookings",
}); 