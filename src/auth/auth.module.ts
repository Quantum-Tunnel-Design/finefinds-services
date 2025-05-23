import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { CognitoClientStrategy } from './strategies/cognito-client.strategy';
import { CognitoAdminStrategy } from './strategies/cognito-admin.strategy';
import { UsersModule } from '../users/users.module';
// AuthController is no longer used and can be removed or its import commented out
// import { AuthController } from './auth.controller'; 
import { SessionService } from './session.service';
import { LoginAttemptService } from './services/login-attempt.service';
import cognitoConfig from './cognito.config';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from './guards/roles.guard';

// console.log('AuthModule __dirname:', __dirname); // Log __dirname
// const resolvedTemplatePath = join(__dirname, 'templates'); // Log resolved path
// console.log('Resolved template path for MailerModule:', resolvedTemplatePath);

@Module({
  imports: [
    ConfigModule.forFeature(cognitoConfig),
    PassportModule.register({ defaultStrategy: 'cognito-client' }),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => {
        const templateDir = join(__dirname, 'templates');
        console.log('[MailerModule Factory] __dirname:', __dirname);
        console.log('[MailerModule Factory] Resolved template directory:', templateDir);
        return {
          transport: {
            host: config.get('MAIL_HOST'),
            port: config.get('MAIL_PORT'),
            secure: config.get('MAIL_SECURE') === 'true',
            auth: {
              user: config.get('MAIL_USER'),
              pass: config.get('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: config.get('MAIL_FROM'),
          },
          template: {
            dir: templateDir, // Use the logged path
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    PrismaModule,
  ],
  providers: [
    AuthService,
    AuthResolver,
    CognitoClientStrategy,
    CognitoAdminStrategy,
    SessionService,
    LoginAttemptService,
    RolesGuard,
  ],
  // controllers: [AuthController], // AuthController removed as it's now empty
  exports: [AuthService, SessionService],
})
export class AuthModule {} 