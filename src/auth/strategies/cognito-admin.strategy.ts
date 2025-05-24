import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { COGNITO_GROUPS } from '../constants/cognito-groups';

@Injectable()
export class CognitoAdminStrategy extends PassportStrategy(Strategy, 'cognito-admin') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('COGNITO_ADMIN_PUBLIC_KEY'),
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
    if (groups.includes(COGNITO_GROUPS.ADMIN)) return UserRole.ADMIN;
    return UserRole.ADMIN; // Default role for admin strategy
  }
} 