import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { UserRole } from '@prisma/client';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class CognitoClientStrategy extends PassportStrategy(Strategy, 'cognito-client') {
  private verifier: any;

  constructor(private configService: ConfigService) {
    const cognitoConfig = configService.get('cognito.client');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}/.well-known/jwks.json`,
      }),
    });

    if (!cognitoConfig.userPoolId || !cognitoConfig.clientId) {
      throw new Error('Client Cognito configuration is missing. Please check your environment variables.');
    }

    this.verifier = CognitoJwtVerifier.create({
      userPoolId: cognitoConfig.userPoolId,
      tokenUse: 'id',
      clientId: cognitoConfig.clientId,
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