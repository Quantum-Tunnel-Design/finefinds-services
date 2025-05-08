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
        jwksUri: `${configService.get('cognito.authority')}/.well-known/jwks.json`,
      }),
    });

    this.verifier = CognitoJwtVerifier.create({
      userPoolId: configService.get('cognito.userPoolId'),
      tokenUse: 'access',
      clientId: configService.get('cognito.clientId'),
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
    if (groups.includes('admin')) return UserRole.ADMIN;
    if (groups.includes('vendor')) return UserRole.VENDOR;
    if (groups.includes('parent')) return UserRole.PARENT;
    return UserRole.STUDENT;
  }
} 