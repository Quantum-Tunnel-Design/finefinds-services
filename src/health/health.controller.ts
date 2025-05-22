import { Controller, Get, HttpCode } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @HttpCode(200)
  health() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('debug-env')
  @HttpCode(200)
  debugEnv() {
    // Create a sanitized version of the environment variables for debugging
    // Only include non-sensitive variables or indicate that sensitive ones are set
    return {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      // Indicate if Cognito variables are set without showing values
      COGNITO_CLIENT_USER_POOL_ID: process.env.COGNITO_CLIENT_USER_POOL_ID ? 'Set' : 'Not set',
      COGNITO_CLIENT_CLIENT_ID: process.env.COGNITO_CLIENT_CLIENT_ID ? 'Set' : 'Not set',
      COGNITO_ADMIN_USER_POOL_ID: process.env.COGNITO_ADMIN_USER_POOL_ID ? 'Set' : 'Not set',
      COGNITO_ADMIN_CLIENT_ID: process.env.COGNITO_ADMIN_CLIENT_ID ? 'Set' : 'Not set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
      // Database URLs (sanitized)
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    };
  }
} 