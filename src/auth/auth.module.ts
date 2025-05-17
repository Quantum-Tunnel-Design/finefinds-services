import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { CognitoClientStrategy } from './strategies/cognito-client.strategy';
import { CognitoAdminStrategy } from './strategies/cognito-admin.strategy';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import cognitoConfig from './cognito.config';

@Module({
  imports: [
    ConfigModule.forFeature(cognitoConfig),
    PassportModule.register({ defaultStrategy: 'cognito-client' }),
    UsersModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    CognitoClientStrategy,
    CognitoAdminStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {} 