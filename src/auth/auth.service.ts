import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UsersService } from '../users/users.service';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { ConfirmSignUpInput } from './dto/confirm-sign-up.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { ParentSignUpInput } from './dto/parent-sign-up.input';
import { UserRole } from '@prisma/client';
import { AuthResponse } from './models/auth-response.model';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private sessionService: SessionService,
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get('AWS_REGION'),
    });
    this.userPoolId = this.configService.get('COGNITO_CLIENT_USER_POOL_ID');
    this.clientId = this.configService.get('COGNITO_CLIENT_CLIENT_ID');
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

      if (!response.AuthenticationResult?.AccessToken) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Calculate token expiration based on remember me
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (input.rememberMe ? 30 : 1)); // 30 days for remember me, 1 day otherwise

      // Create session
      await this.sessionService.createSession(
        user.id,
        response.AuthenticationResult.AccessToken,
        expiresAt
      );

      // Get user groups from Cognito
      const getUserCommand = new GetUserCommand({
        AccessToken: response.AuthenticationResult.AccessToken,
      });

      const cognitoUser = await this.cognitoClient.send(getUserCommand);
      const groups = cognitoUser.UserAttributes?.find(attr => attr.Name === 'custom:groups')?.Value?.split(',') || [];

      // Update user role if needed
      if (groups.includes('parent') && user.role !== UserRole.PARENT) {
        await this.usersService.update(user.id, { role: UserRole.PARENT });
        user.role = UserRole.PARENT;
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async logout(token: string): Promise<AuthResponse> {
    try {
      // Get user from token
      const getUserCommand = new GetUserCommand({
        AccessToken: token,
      });

      const user = await this.cognitoClient.send(getUserCommand);

      // Sign out from Cognito
      const signOutCommand = new GlobalSignOutCommand({
        AccessToken: token,
      });

      await this.cognitoClient.send(signOutCommand);

      // Delete session
      await this.sessionService.deleteSession(token);

      return {
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
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

  async parentSignUp(input: ParentSignUpInput): Promise<AuthResponse> {
    try {
      // Validate password match
      if (input.password !== input.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Validate at least one child
      if (!input.children || input.children.length === 0) {
        throw new BadRequestException('At least one child is required');
      }

      // Validate maximum number of children
      if (input.children.length > 10) {
        throw new BadRequestException('Maximum 10 children allowed');
      }

      // Validate date of birth is not in the future
      const now = new Date();
      for (const child of input.children) {
        if (child.dateOfBirth > now) {
          throw new BadRequestException('Date of birth cannot be in the future');
        }
      }

      // Check if email already exists
      const existingUser = await this.usersService.findByEmail(input.email);
      if (existingUser) {
        throw new BadRequestException('Email already registered');
      }

      // Create Cognito user
      const signUpCommand = new SignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        Password: input.password,
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'given_name', Value: input.firstName },
          { Name: 'family_name', Value: input.lastName },
          { Name: 'phone_number', Value: input.phoneNumber },
          { Name: 'custom:role', Value: UserRole.PARENT },
        ],
      });

      const cognitoResponse = await this.cognitoClient.send(signUpCommand);

      // Add user to parent group
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: input.email,
        GroupName: 'parent',
      });

      await this.cognitoClient.send(addToGroupCommand);

      // Create user in database with children
      await this.usersService.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.PARENT,
        cognitoSub: cognitoResponse.UserSub,
        phoneNumber: input.phoneNumber,
        children: input.children.map(child => ({
          firstName: child.firstName,
          lastName: child.lastName,
          gender: child.gender,
          dateOfBirth: child.dateOfBirth,
        })),
      });

      return {
        message: 'Parent registered successfully. Please check your email for verification code.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException(error.message);
    }
  }
} 