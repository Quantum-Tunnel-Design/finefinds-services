export const COGNITO_GROUPS = {
  GUEST: 'guests',
  PARENT: 'parents',
  STUDENT: 'students',
  VENDOR: 'vendors',
  ADMIN: 'admins',
} as const;

export type CognitoGroup = typeof COGNITO_GROUPS[keyof typeof COGNITO_GROUPS]; 