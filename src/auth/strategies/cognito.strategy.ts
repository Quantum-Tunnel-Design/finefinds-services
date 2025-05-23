import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { UserRole } from '@prisma/client';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class CognitoStrategy extends PassportStrategy(Strategy) {
  private verifier: any;

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${configService.get('AWS_REGION')}.amazonaws.com/${configService.get('COGNITO_CLIENT_USER_POOL_ID')}/.well-known/jwks.json`,
      }),
    });

    const userPoolId = configService.get('COGNITO_CLIENT_USER_POOL_ID');
    const clientId = configService.get('COGNITO_CLIENT_CLIENT_ID');
    const clientSecret = configService.get('COGNITO_CLIENT_CLIENT_SECRET');
    if (!userPoolId || !clientId || !clientSecret) {
      throw new Error('Cognito configuration is missing. Please check your environment variables.');
    }

    this.verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
      clientSecret,
    });
  }

  async validate(payload: any) {
    try {
      // Verify the token with Cognito
      await this.verifier.verify(payload);

      // Extract user info from claims
      const user = {
        id: payload.sub,
        email: payload.email,
        role: this.mapCognitoGroupsToRole(payload['cognito:groups'] || []),
      };

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private mapCognitoGroupsToRole(groups: string[]): UserRole {
    if (groups.includes('parent')) return UserRole.PARENT;
    if (groups.includes('vendor')) return UserRole.VENDOR;
    return UserRole.STUDENT;
  }
} 