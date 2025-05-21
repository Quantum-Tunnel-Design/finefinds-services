import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { CognitoClientStrategy } from './strategies/cognito-client.strategy';
import { CognitoAdminStrategy } from './strategies/cognito-admin.strategy';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { SessionService } from './session.service';
import cognitoConfig from './cognito.config';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forFeature(cognitoConfig),
    PassportModule.register({ defaultStrategy: 'cognito-client' }),
    ScheduleModule.forRoot(),
    UsersModule,
    PrismaModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    CognitoClientStrategy,
    CognitoAdminStrategy,
    SessionService,
    RolesGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, SessionService],
})
export class AuthModule {} 