import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { COGNITO_GROUPS } from '../constants/cognito-groups';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class CognitoClientStrategy extends PassportStrategy(Strategy, 'cognito-client') {
  constructor(private configService: ConfigService) {
    const userPoolId = configService.get<string>('COGNITO_CLIENT_USER_POOL_ID');
    const region = configService.get<string>('AWS_REGION');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
      }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    const groups = payload['cognito:groups'] || [];
    const role = this.getRoleFromGroups(groups);
    
    return {
      sub: payload.sub,
      email: payload.email,
      role,
      groups,
    };
  }

  private getRoleFromGroups(groups: string[]): UserRole {
    if (groups.includes(COGNITO_GROUPS.PARENT)) return UserRole.PARENT;
    if (groups.includes(COGNITO_GROUPS.VENDOR)) return UserRole.VENDOR;
    return UserRole.PARENT; // Default role
  }
} 