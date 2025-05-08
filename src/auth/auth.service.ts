import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UsersService } from '../users/users.service';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { ConfirmSignUpInput } from './dto/confirm-sign-up.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { UserRole } from '@prisma/client';
import { AuthResponse } from './models/auth-response.model';

@Injectable()
export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get('AWS_REGION'),
    });
    this.userPoolId = this.configService.get('COGNITO_USER_POOL_ID');
    this.clientId = this.configService.get('COGNITO_CLIENT_ID');
  }

  async signUp(input: SignUpInput): Promise<AuthResponse> {
    try {
      const signUpCommand = new SignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        Password: input.password,
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'given_name', Value: input.firstName },
          { Name: 'family_name', Value: input.lastName },
          { Name: 'custom:role', Value: input.role },
        ],
      });

      await this.cognitoClient.send(signUpCommand);

      return {
        message: 'User registered successfully. Please check your email for verification code.',
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async confirmSignUp(input: ConfirmSignUpInput): Promise<AuthResponse> {
    try {
      const confirmCommand = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        ConfirmationCode: input.code,
      });

      await this.cognitoClient.send(confirmCommand);

      return {
        message: 'Email verified successfully. You can now sign in.',
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async signIn(input: SignInInput): Promise<AuthResponse> {
    try {
      const authCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: input.password,
        },
      });

      const response = await this.cognitoClient.send(authCommand);
      const user = await this.usersService.findByEmail(input.email);

      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<AuthResponse> {
    try {
      const forgotPasswordCommand = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: input.email,
      });

      await this.cognitoClient.send(forgotPasswordCommand);

      return {
        message: 'Verification code sent to your email.',
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
    try {
      const confirmForgotPasswordCommand = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: input.email,
        ConfirmationCode: input.code,
        Password: input.newPassword,
      });

      await this.cognitoClient.send(confirmForgotPasswordCommand);

      return {
        message: 'Password reset successfully. You can now sign in with your new password.',
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
} 