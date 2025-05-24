import { registerEnumType } from '@nestjs/graphql';

export enum AgeGroup {
  INFANT = 'INFANT', // 0-2 years
  TODDLER = 'TODDLER', // 2-4 years
  PRESCHOOL = 'PRESCHOOL', // 4-6 years
  ELEMENTARY = 'ELEMENTARY', // 6-12 years
  TEEN = 'TEEN', // 12-18 years
}

registerEnumType(AgeGroup, {
  name: 'AgeGroup',
  description: 'Age groups for filtering users',
}); 