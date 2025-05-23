import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private clientVerifier: CognitoJwtVerifier<any, any, any>;
  private adminVerifier: CognitoJwtVerifier<any, any, any>;
  private readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super();

    const clientUserPoolId = this.configService.get('COGNITO_CLIENT_USER_POOL_ID');
    const clientClientId = this.configService.get('COGNITO_CLIENT_CLIENT_ID');
    const adminUserPoolId = this.configService.get('COGNITO_ADMIN_USER_POOL_ID');
    const adminClientId = this.configService.get('COGNITO_ADMIN_CLIENT_ID');

    console.log('JWT Auth Guard Configuration:');
    console.log('- Client User Pool ID:', clientUserPoolId);
    console.log('- Client Client ID:', clientClientId);
    console.log('- Admin User Pool ID:', adminUserPoolId);
    console.log('- Admin Client ID:', adminClientId);

    if (!clientUserPoolId || !clientClientId || !adminUserPoolId || !adminClientId) {
      throw new Error('Missing required Cognito configuration');
    }

    this.clientVerifier = CognitoJwtVerifier.create({
      userPoolId: clientUserPoolId,
      tokenUse: 'id',
      clientId: clientClientId,
    });

    this.adminVerifier = CognitoJwtVerifier.create({
      userPoolId: adminUserPoolId,
      tokenUse: 'id',
      clientId: adminClientId,
    });
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private logTokenTimeInfo(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      const now = new Date();
      const exp = new Date(payload.exp * 1000);
      const iat = new Date(payload.iat * 1000);
      const timeDiff = (exp.getTime() - now.getTime()) / (1000 * 60); // in minutes

      console.log('Token Time Information:');
      console.log('- Current time:', now.toISOString());
      console.log('- Token issued at:', iat.toISOString());
      console.log('- Token expires at:', exp.toISOString());
      console.log('- Time difference (minutes):', timeDiff.toFixed(2));
      console.log('- Token age (minutes):', ((now.getTime() - iat.getTime()) / (1000 * 60)).toFixed(2));
      console.log('- Token lifetime (minutes):', ((exp.getTime() - iat.getTime()) / (1000 * 60)).toFixed(2));

      return {
        isExpired: timeDiff < 0,
        timeDiff,
        exp,
        iat,
        now
      };
    } catch (error) {
      console.log('Error parsing token time info:', error.message);
      return null;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = this.getRequest(context);
    const token = this.extractTokenFromHeader(request);

    console.log('JWT Auth Guard - Token:', token ? 'Present' : 'Missing');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Log token time information and get time details
    const timeInfo = this.logTokenTimeInfo(token);
    if (!timeInfo) {
      throw new UnauthorizedException('Invalid token format');
    }

    // If token is expired, provide a more helpful error message
    if (timeInfo.isExpired) {
      const expiryTime = timeInfo.exp.toLocaleString();
      const timeSinceExpiry = Math.abs(timeInfo.timeDiff).toFixed(2);
      throw new UnauthorizedException(
        `Token expired at ${expiryTime} (${timeSinceExpiry} minutes ago). Please refresh your session.`
      );
    }

    let cognitoPayload: any;
    let clientError: any;
    let adminError: any;

    try {
      // Try client pool first
      try {
        console.log('Attempting client pool verification...');
        cognitoPayload = await this.clientVerifier.verify(token);
        console.log('Client pool verification successful');
      } catch (error) {
        clientError = error;
        console.log('Client pool verification failed:', error.message);
        
        // Try admin pool
        try {
          console.log('Attempting admin pool verification...');
          cognitoPayload = await this.adminVerifier.verify(token);
          console.log('Admin pool verification successful');
        } catch (error) {
          adminError = error;
          console.log('Admin pool verification failed:', error.message);
          
          // Check if both errors are time-related
          const isTimeError = (clientError.message?.includes('expired') || clientError.message?.includes('future')) &&
                            (error.message?.includes('expired') || error.message?.includes('future'));
          
          if (isTimeError) {
            const expiryTime = timeInfo.exp.toLocaleString();
            const timeSinceExpiry = Math.abs(timeInfo.timeDiff).toFixed(2);
            throw new UnauthorizedException(
              `Token expired at ${expiryTime} (${timeSinceExpiry} minutes ago). Please refresh your session.`
            );
          }
          
          throw new UnauthorizedException(
            `Token verification failed for both pools. Client error: ${clientError.message}, Admin error: ${error.message}`
          );
        }
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token or token verification failed for all configured user pools.');
    }

    if (!cognitoPayload || !cognitoPayload.sub) {
      console.log('Token verification succeeded but missing sub claim:', cognitoPayload);
      throw new UnauthorizedException('Token verification succeeded but essential claims (sub) are missing.');
    }

    console.log('Token payload:', {
      sub: cognitoPayload.sub,
      iss: cognitoPayload.iss,
      aud: cognitoPayload.aud,
      token_use: cognitoPayload.token_use,
    });

    // Fetch the user from the local database using cognitoSub (payload.sub)
    const userFromDb = await this.usersService.findByCognitoId(cognitoPayload.sub);

    console.log('User from DB:', userFromDb ? {
      id: userFromDb.id,
      email: userFromDb.email,
      role: userFromDb.role,
    } : 'Not found');

    if (!userFromDb) {
      throw new UnauthorizedException(
        'User identified by token not found in our system. Please ensure the user is registered.'
      );
    }

    request.user = userFromDb;
    return true;
  }
} 