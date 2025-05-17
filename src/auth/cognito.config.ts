import { registerAs } from '@nestjs/config';

export default registerAs('cognito', () => ({
  client: {
    region: process.env.AWS_REGION,
    userPoolId: process.env.COGNITO_CLIENT_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_CLIENT_ID,
    authority: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_CLIENT_USER_POOL_ID}`,
  },
  admin: {
    region: process.env.AWS_REGION,
    userPoolId: process.env.COGNITO_ADMIN_USER_POOL_ID,
    clientId: process.env.COGNITO_ADMIN_CLIENT_ID,
    authority: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_ADMIN_USER_POOL_ID}`,
  },
})); 