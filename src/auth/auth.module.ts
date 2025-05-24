import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { CognitoClientStrategy } from './strategies/cognito-client.strategy';
import { CognitoAdminStrategy } from './strategies/cognito-admin.strategy';
import { UsersModule } from '../users/users.module';
import { SessionService } from './session.service';
import { LoginAttemptService } from './services/login-attempt.service';
import cognitoConfig from './cognito.config';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from './guards/roles.guard';
import { SessionModule } from './session.module';
import { LoginAttemptModule } from './services/login-attempt.module'
import { AwsConfigService } from '../config/aws.config';


@Module({
  imports: [
    ConfigModule.forFeature(cognitoConfig),
    PassportModule.register({ defaultStrategy: 'cognito-client' }),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST'),
          port: configService.get('SMTP_PORT'),
          secure: configService.get('SMTP_SECURE') === 'true',
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.get('SMTP_FROM'),
        },
        template: {
          dir: join(__dirname, '..', 'templates'),
          adapter: require('handlebars'),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    PrismaModule,
    SessionModule,
    LoginAttemptModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    CognitoClientStrategy,
    CognitoAdminStrategy,
    SessionService,
    LoginAttemptService,
    RolesGuard,
    AwsConfigService,
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {} 