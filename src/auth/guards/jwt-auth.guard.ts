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

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private usersService: UsersService,
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

    let cognitoPayload: any;

    try {
      // Try client pool first
      try {
        cognitoPayload = await this.clientVerifier.verify(token);
      } catch (clientError) {
        // If client verification fails, try admin pool
        cognitoPayload = await this.adminVerifier.verify(token);
        // For admin pool, we can infer role or ensure it's correctly set in DB if admins are also in User table
      }
    } catch (error) {
      // This catch block handles errors from both verifier.verify attempts if the token is truly invalid for both pools
      throw new UnauthorizedException('Invalid token or token verification failed for all configured user pools.');
    }

    if (!cognitoPayload || !cognitoPayload.sub) {
        // This case should ideally be caught by the verifiers throwing an error, but as a safeguard:
        throw new UnauthorizedException('Token verification succeeded but essential claims (sub) are missing.');
    }

    // Fetch the user from the local database using cognitoSub (payload.sub)
    const userFromDb = await this.usersService.findByCognitoId(cognitoPayload.sub);

    if (!userFromDb) {
      throw new UnauthorizedException(
        'User identified by token not found in our system. Please ensure the user is registered.'
      );
    }

    // If the token was from the admin pool, ensure the DB role reflects ADMIN status, or override if necessary.
    // This depends on whether admins are purely in Cognito Admin Pool or also mirrored in your User table with an ADMIN role.
    // For simplicity, if cognitoPayload came from adminVerifier, we could ensure role is ADMIN,
    // but it's better if the userFromDb.role is the source of truth from your DB.
    // Example: if (cognitoPayload.iss.includes(this.configService.get('COGNITO_ADMIN_USER_POOL_ID'))) {
    //    if (userFromDb.role !== UserRole.ADMIN) { /* Handle discrepancy or log */ }
    // }

    request.user = userFromDb; // Attach the full Prisma User object from DB
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 