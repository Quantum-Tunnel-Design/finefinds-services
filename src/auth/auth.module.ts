import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { CognitoStrategy } from './strategies/cognito.strategy';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'cognito' }),
    UsersModule,
  ],
  providers: [AuthService, AuthResolver, CognitoStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {} 