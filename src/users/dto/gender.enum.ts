import { registerEnumType } from '@nestjs/graphql';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  // Consider adding 'OTHER' or 'PREFER_NOT_TO_SAY' in the future for inclusivity
}

registerEnumType(Gender, {
  name: 'Gender',
  description: 'Represents the gender of an individual.',
}); 