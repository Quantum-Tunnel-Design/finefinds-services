import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private clientVerifier: CognitoJwtVerifier<any, any, any>;
  private adminVerifier: CognitoJwtVerifier<any, any, any>;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    super();
    this.clientVerifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.get('COGNITO_CLIENT_USER_POOL_ID'),
      tokenUse: 'access',
      clientId: this.configService.get('COGNITO_CLIENT_CLIENT_ID'),
    });

    this.adminVerifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.get('COGNITO_ADMIN_USER_POOL_ID'),
      tokenUse: 'access',
      clientId: this.configService.get('COGNITO_ADMIN_CLIENT_ID'),
    });
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
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

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Try client pool first
      try {
        const payload = await this.clientVerifier.verify(token);
        request.user = {
          id: payload.sub,
          email: payload.email,
          role: payload['custom:role'],
        };
        return true;
      } catch (clientError) {
        // If client verification fails, try admin pool
        const payload = await this.adminVerifier.verify(token);
        request.user = {
          id: payload.sub,
          email: payload.email,
          role: 'ADMIN', // Admin users always have ADMIN role
        };
        return true;
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 