import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import * as crypto from 'crypto'; // No longer needed
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
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminUpdateUserAttributesCommand,
  
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { UsersService } from '../users/users.service';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { ConfirmSignUpInput } from './dto/confirm-sign-up.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { ParentSignUpInput } from './dto/parent-sign-up.input';
import { AdminSignInInput } from './dto/admin-sign-in.input';
import { AdminAccountInput } from './dto/admin-account.input';
import { UserRole, Gender } from '@prisma/client';
import { AuthResponse } from './models/auth-response.model';
import { SessionService } from './session.service';
import { UpdateParentProfileInput } from './dto/update-parent-profile.input';
import { UpdateParentPasswordInput } from './dto/update-parent-password.input';
import { VendorSignUpInput } from './dto/vendor-sign-up.input';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';
import { VendorLoginInput } from './dto/vendor-login.input';
import { LoginAttemptService } from './services/login-attempt.service';

@Injectable()
export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private sessionService: SessionService,
    private mailerService: MailerService,
    private prisma: PrismaService,
    private loginAttemptService: LoginAttemptService,
  ) {
    const awsRegion = this.configService.get<string>('AWS_REGION');
    // const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID'); // Removed
    // const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY'); // Removed
    // const sessionToken = this.configService.get<string>('AWS_SESSION_TOKEN'); // Optional // Removed

    if (!awsRegion) { // Modified check: only region is mandatory here
      throw new Error('Missing AWS_REGION configuration for Cognito client. Check environment variables.');
    }

    // const credentials = { // Removed
    //   accessKeyId, // Removed
    //   secretAccessKey, // Removed
    //   ...(sessionToken && { sessionToken }), // Add sessionToken only if it exists // Removed
    // }; // Removed

    this.cognitoClient = new CognitoIdentityProviderClient({
      region: awsRegion,
      // credentials, // Removed: SDK will use default credential provider chain (incl. IAM Task Role)
    });
  }

  async signUp(input: SignUpInput): Promise<AuthResponse> {
    const userPoolId = this.configService.get<string>('COGNITO_CLIENT_USER_POOL_ID');
    const existingUser = await this.usersService.findByEmail(input.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const userAttributes = [
      { Name: 'email', Value: input.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: input.firstName },
      { Name: 'family_name', Value: input.lastName },
      { Name: 'custom:roleName', Value: input.role },
      { Name: 'custom:metadata', Value: JSON.stringify({ createdAt: new Date().toISOString() }) },
    ];

    try {
      const adminCreateUserCmd = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        UserAttributes: userAttributes,
        MessageAction: 'SUPPRESS',
      });
      const cognitoUserResponse = await this.cognitoClient.send(adminCreateUserCmd);
      const cognitoSub = cognitoUserResponse.User?.Attributes?.find(attr => attr.Name === 'sub')?.Value || input.email;

      const adminSetPasswordCmd = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        Password: input.password,
        Permanent: true,
      });
      await this.cognitoClient.send(adminSetPasswordCmd);
      
      let groupName: string;
      if (input.role === UserRole.PARENT) groupName = 'parent';
      else if (input.role === UserRole.VENDOR) groupName = 'vendor';
      else {
        console.warn(`[AuthService signUp] Unknown role ${input.role} for group assignment for user ${input.email}.`);
      }
      if (groupName) {
        const addToGroupCommand = new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: input.email,
            GroupName: groupName,
        });
        await this.cognitoClient.send(addToGroupCommand);
      }

      await this.usersService.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role as UserRole,
        cognitoSub: cognitoSub,
      });

      return {
        message: 'User account created successfully. You can now sign in.',
      };
    } catch (error) {
      console.error('[AuthService signUp Admin Flow] Error:', error);
      throw new BadRequestException(error.message || 'Could not register user');
    }
  }

  async signIn(input: SignInInput): Promise<AuthResponse> {
    const clientId = this.configService.get<string>('COGNITO_CLIENT_CLIENT_ID');

    const authParameters: { [key: string]: string } = {
        USERNAME: input.email,
        PASSWORD: input.password,
    };

    try {
      const authCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: authParameters,
      });

      const response = await this.cognitoClient.send(authCommand);
      const user = await this.usersService.findByEmail(input.email);

      if (!response.AuthenticationResult?.IdToken) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Calculate token expiration based on remember me
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (input.rememberMe ? 30 : 1)); // 30 days for remember me, 1 day otherwise

      // Create session with ID token
      await this.sessionService.createSession(
        user.id,
        response.AuthenticationResult.IdToken,
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
    const clientId = this.configService.get<string>('COGNITO_CLIENT_CLIENT_ID');
    // No SecretHash computation or usage

    const params: any = {
        ClientId: clientId,
        Username: input.email,
    };
    // No SecretHash to add to params

    try {
      const user = await this.usersService.findByEmail(input.email);
      if (user?.role === UserRole.ADMIN) {
        // Admins should use a different flow or be handled by admin console
        console.warn(`[AuthService forgotPassword] Attempt to reset password for admin user: ${input.email}. Denying.`);
        return {
          message: 'Password reset for admin accounts should be handled via the admin console or a dedicated admin password reset flow.',
        };
      }

      // For non-admin users, proceed with Cognito ForgotPasswordCommand
      // We don't throw an error if the user is not found to prevent email enumeration
      const forgotPasswordCommand = new ForgotPasswordCommand(params);
      await this.cognitoClient.send(forgotPasswordCommand);

      return {
        message: 'If an account with that email exists, a password reset code will be sent.',
      };
    } catch (error) {
      // Log the error for server-side diagnostics but return a generic message to the client
      console.error('[AuthService forgotPassword] Error sending forgot password command:', error);
      return {
        message: 'If an account with that email exists, a password reset code will be sent.',
      };
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
    const clientId = this.configService.get<string>('COGNITO_CLIENT_CLIENT_ID');
    // No SecretHash computation or usage

    const params: any = {
        ClientId: clientId,
        Username: input.email,
        ConfirmationCode: input.code,
        Password: input.newPassword,
    };
    // No SecretHash to add to params

    try {
      const confirmForgotPasswordCommand = new ConfirmForgotPasswordCommand(params);
      await this.cognitoClient.send(confirmForgotPasswordCommand);
      
      const user = await this.usersService.findByEmail(input.email);
      if (user) {
        await this.sessionService.deleteUserSessions(user.id);
      }

      return {
        message: 'Password has been successfully reset.',
      };
    } catch (error) {
      console.error('[AuthService resetPassword] Error:', error);
      throw new BadRequestException(error.message || 'Could not reset password');
    }
  }

  async parentSignUp(input: ParentSignUpInput): Promise<AuthResponse> {
    const userPoolId = this.configService.get<string>('COGNITO_CLIENT_USER_POOL_ID');

    // Validate input
    if (input.password !== input.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (!input.children || input.children.length === 0) {
      throw new BadRequestException('At least one child is required');
    }
    if (input.children.length > 10) {
      throw new BadRequestException('Maximum 10 children allowed');
    }
    const now = new Date();
    for (const child of input.children) {
      const dob = typeof child.dateOfBirth === 'string' ? new Date(child.dateOfBirth) : child.dateOfBirth;
      if (dob > now) {
        throw new BadRequestException('Date of birth cannot be in the future');
      }
    }
    const existingUser = await this.usersService.findByEmail(input.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const userAttributes = [
      { Name: 'email', Value: input.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: input.firstName },
      { Name: 'family_name', Value: input.lastName },
      { Name: 'phone_number', Value: input.phoneNumber },
      { Name: 'custom:roleName', Value: UserRole.PARENT },
      { Name: 'custom:metadata', Value: JSON.stringify({ 
        createdAt: new Date().toISOString(),
        phoneNumber: input.phoneNumber,
        childrenCount: input.children.length
      }) },
    ];

    try {
      const adminCreateUserCmd = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        UserAttributes: userAttributes,
        MessageAction: 'SUPPRESS',
      });
      const cognitoUserResponse = await this.cognitoClient.send(adminCreateUserCmd);
      const cognitoSub = cognitoUserResponse.User?.Attributes?.find(attr => attr.Name === 'sub')?.Value || input.email;

      const adminSetPasswordCmd = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        Password: input.password,
        Permanent: true,
      });
      await this.cognitoClient.send(adminSetPasswordCmd);

      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        GroupName: 'parent',
      });
      await this.cognitoClient.send(addToGroupCommand);

      const dbUser = await this.usersService.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.PARENT,
        cognitoSub: cognitoSub,
        phoneNumber: input.phoneNumber,
        children: input.children.map(child => ({
          firstName: child.firstName,
          lastName: child.lastName,
          gender: child.gender === 'male' ? Gender.MALE : Gender.FEMALE,
          dateOfBirth: typeof child.dateOfBirth === 'string' ? new Date(child.dateOfBirth) : child.dateOfBirth,
        })),
      });

      // Programmatically sign in the user to get tokens
      const clientId = this.configService.get<string>('COGNITO_CLIENT_CLIENT_ID');

      const authResponse = await this.cognitoClient.send(new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: clientId,
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: input.password,
        },
      }));

      if (!authResponse.AuthenticationResult?.IdToken) {
        throw new BadRequestException('Failed to authenticate new parent user to retrieve tokens.');
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (authResponse.AuthenticationResult.ExpiresIn || 3600));

      await this.sessionService.createSession(
        dbUser.id,
        authResponse.AuthenticationResult.IdToken,
        expiresAt,
      );

      return {
        idToken: authResponse.AuthenticationResult.IdToken,
        refreshToken: authResponse.AuthenticationResult.RefreshToken,
        user: dbUser,
        message: 'Parent account created and verified successfully.',
      };
    } catch (error) {
      console.error('[AuthService parentSignUp Admin Flow] Error:', error);
      throw new BadRequestException(error.message || 'Could not complete parent sign up.');
    }
  }

  async adminSignIn(input: AdminSignInInput): Promise<AuthResponse> {
    const adminClientId = this.configService.get<string>('COGNITO_ADMIN_CLIENT_ID');

    const authParameters: { [key: string]: string } = {
      USERNAME: input.username,
      PASSWORD: input.password,
    };

    try {
      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: this.configService.get<string>('COGNITO_ADMIN_USER_POOL_ID'),
        ClientId: adminClientId,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH' as AuthFlowType,
        AuthParameters: authParameters,
      });

      const response = await this.cognitoClient.send(authCommand);
      const user = await this.usersService.findByEmail(input.username);

      if (!response.AuthenticationResult?.IdToken) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Create session with ID token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // Admin sessions expire in 1 day

      await this.sessionService.createSession(
        user.id,
        response.AuthenticationResult.IdToken,
        expiresAt
      );

      return {
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async createAdminAccount(input: AdminAccountInput): Promise<AuthResponse> {
    try {
      // Check if user already exists in Cognito
      const existingUser = await this.usersService.findByEmail(input.email);
      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      const userPoolId = this.configService.get<string>('COGNITO_ADMIN_USER_POOL_ID');
      if (!userPoolId) {
        console.error('[AuthService createAdminAccount] Missing COGNITO_ADMIN_USER_POOL_ID configuration');
        throw new Error('Missing Cognito admin user pool configuration');
      }

      // Create user in Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: input.firstName },
          { Name: 'family_name', Value: input.lastName },
          { Name: 'custom:roleName', Value: UserRole.ADMIN },
          { Name: 'custom:metadata', Value: JSON.stringify({ createdAt: new Date().toISOString() }) },
        ],
        MessageAction: 'SUPPRESS',
      });

      console.log('[AuthService createAdminAccount] Creating Cognito user...');
      let cognitoUserResponse;
      try {
        cognitoUserResponse = await this.cognitoClient.send(createUserCommand);
      } catch (error) {
        console.error('[AuthService createAdminAccount] Cognito create user error:', error);
        let detailMessage = error.message;
        // Check for AggregateError-like structure
        if (error && typeof error === 'object' && Array.isArray(error.errors) && error.errors.length > 0) {
          detailMessage = error.errors.map(e => e.message || String(e)).join('; ');
        }
        throw new Error(`Failed to create Cognito user: ${detailMessage || 'Network issue or timeout connecting to Cognito'}`);
      }

      const cognitoSub = cognitoUserResponse.User?.Attributes?.find(attr => attr.Name === 'sub')?.Value;
      if (!cognitoSub) {
        console.error('[AuthService createAdminAccount] Failed to extract Cognito sub from response:', cognitoUserResponse);
        throw new Error('Failed to get Cognito sub for admin user');
      }

      // Set password for the user
      console.log('[AuthService createAdminAccount] Setting user password...');
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        Password: input.password,
        Permanent: true,
      });

      try {
        await this.cognitoClient.send(setPasswordCommand);
      } catch (error) {
        console.error('[AuthService createAdminAccount] Cognito set password error:', error);
        throw new Error(`Failed to set user password: ${error.message}`);
      }

      // Create admin in database
      console.log('[AuthService createAdminAccount] Creating user in database...');
      try {
        await this.usersService.create({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: UserRole.ADMIN,
          cognitoSub: cognitoSub,
          isEmailVerified: true,
          isActive: true,
        });
      } catch (error) {
        console.error('[AuthService createAdminAccount] Database create user error:', error);
        throw new Error(`Failed to create user in database: ${error.message}`);
      }

      // Sign in the user to get tokens
      console.log('[AuthService createAdminAccount] Signing in user...');
      const clientId = this.configService.get<string>('COGNITO_ADMIN_CLIENT_ID');
      if (!clientId) {
        console.error('[AuthService createAdminAccount] Missing COGNITO_ADMIN_CLIENT_ID configuration');
        throw new Error('Missing Cognito admin client configuration');
      }

      const signInCommand = new AdminInitiateAuthCommand({
        UserPoolId: userPoolId,
        ClientId: clientId,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: input.password,
        },
      });

      let authResponse;
      try {
        authResponse = await this.cognitoClient.send(signInCommand);
      } catch (error) {
        console.error('[AuthService createAdminAccount] Cognito sign in error:', error);
        throw new Error(`Failed to sign in user: ${error.message}`);
      }

      return {
        idToken: authResponse.AuthenticationResult?.IdToken || '',
        refreshToken: authResponse.AuthenticationResult?.RefreshToken || '',
        message: 'Admin account created successfully',
      };
    } catch (error) {
      console.error('[AuthService createAdminAccount] Error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create admin account: ${error.message || 'Unknown error'}`,
      );
    }
  }

  async resetAdminPassword(adminEmail: string, newPassword: string): Promise<AuthResponse> {
    try {
      // Verify admin exists
      const admin = await this.usersService.findByEmail(adminEmail);
      if (!admin || admin.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Admin account not found');
      }

      // Set new password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.configService.get<string>('COGNITO_ADMIN_USER_POOL_ID'),
        Username: adminEmail,
        Password: newPassword,
        Permanent: true,
      });

      await this.cognitoClient.send(setPasswordCommand);

      // Delete all sessions
      await this.sessionService.deleteUserSessions(admin.id);

      return {
        message: 'Admin password reset successfully',
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to reset admin password');
    }
  }

  async updateParentProfile(userId: string, input: UpdateParentProfileInput): Promise<AuthResponse> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user || user.role !== UserRole.PARENT) {
        throw new ForbiddenException('User not found or not a parent');
      }

      // Update user in Cognito
      const updateUserCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.configService.get<string>('COGNITO_CLIENT_USER_POOL_ID'),
        Username: user.email,
        UserAttributes: [
          { Name: 'given_name', Value: input.firstName },
          { Name: 'family_name', Value: input.lastName },
          { Name: 'phone_number', Value: input.phoneNumber },
        ],
      });

      await this.cognitoClient.send(updateUserCommand);

      // Update user in database
      await this.usersService.update(userId, {
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
      });

      return {
        message: 'Profile updated successfully',
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to update profile');
    }
  }

  async updateParentPassword(userId: string, input: UpdateParentPasswordInput): Promise<AuthResponse> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.email) {
      throw new BadRequestException('User not found or email missing.');
    }

    // 1. Verify current password by trying to authenticate
    const clientId = this.configService.get<string>('COGNITO_CLIENT_CLIENT_ID');
    // No SecretHash computation or usage for verification

    const verifyAuthParams: { [key: string]: string } = {
        USERNAME: user.email,
        PASSWORD: input.currentPassword,
    };
    // No SecretHash to add to verifyAuthParams

    try {
      const authCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: verifyAuthParams,
      });
      await this.cognitoClient.send(authCommand); // If this doesn't throw, current password is correct
    } catch (error) {
      console.error('[AuthService updateParentPassword] Current password verification failed:', error);
      throw new UnauthorizedException('Invalid current password.');
    }

    // 2. If current password is correct, set the new password using AdminSetUserPasswordCommand
    // AdminSetUserPasswordCommand does not require SecretHash
    try {
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.configService.get<string>('COGNITO_CLIENT_USER_POOL_ID'),
        Username: user.email,
        Password: input.newPassword,
        Permanent: true,
      });

      await this.cognitoClient.send(setPasswordCommand);

      // Delete all sessions
      await this.sessionService.deleteUserSessions(userId);

      return {
        message: 'Password updated successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to update password');
    }
  }

  async vendorSignUp(input: VendorSignUpInput): Promise<AuthResponse> {
    const userPoolId = this.configService.get<string>('COGNITO_CLIENT_USER_POOL_ID');

    // --- Input Validations ---
    if (input.password !== input.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (!input.termsAccepted) {
      throw new BadRequestException('Terms and conditions must be accepted');
    }
    const existingUser = await this.usersService.findByEmail(input.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const userAttributes = [
      { Name: 'email', Value: input.email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'given_name', Value: input.firstName },
      { Name: 'family_name', Value: input.lastName },
      { Name: 'phone_number', Value: input.phoneNumber },
      { Name: 'custom:roleName', Value: UserRole.VENDOR },
      { Name: 'custom:metadata', Value: JSON.stringify({ 
        createdAt: new Date().toISOString(),
        termsAccepted: input.termsAccepted,
        phoneNumber: input.phoneNumber,
        secondaryPhoneNumber: input.secondaryPhoneNumber
      }) },
    ];

    try {
      const adminCreateUserCmd = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        UserAttributes: userAttributes,
        MessageAction: 'SUPPRESS',
      });
      const cognitoUserResponse = await this.cognitoClient.send(adminCreateUserCmd);
      const cognitoSub = cognitoUserResponse.User?.Attributes?.find(attr => attr.Name === 'sub')?.Value || input.email;

      const adminSetPasswordCmd = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        Password: input.password,
        Permanent: true,
      });
      await this.cognitoClient.send(adminSetPasswordCmd);

      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: input.email,
        GroupName: 'vendor',
      });
      await this.cognitoClient.send(addToGroupCommand);

      const dbUser = await this.usersService.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.VENDOR,
        cognitoSub: cognitoSub,
        phoneNumber: input.phoneNumber,
        secondaryPhoneNumber: input.secondaryPhoneNumber,
        termsAccepted: input.termsAccepted,
      });

      // Programmatically sign in the user to get tokens
      const clientId = this.configService.get<string>('COGNITO_CLIENT_CLIENT_ID');

      const authResponse = await this.cognitoClient.send(new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: clientId,
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: input.password,
        },
      }));

      if (!authResponse.AuthenticationResult?.IdToken) {
        throw new BadRequestException('Failed to authenticate new vendor user to retrieve tokens.');
      }

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (authResponse.AuthenticationResult.ExpiresIn || 3600));

      await this.sessionService.createSession(
        dbUser.id,
        authResponse.AuthenticationResult.IdToken,
        expiresAt,
      );
      
      return {
        idToken: authResponse.AuthenticationResult.IdToken,
        refreshToken: authResponse.AuthenticationResult.RefreshToken,
        user: dbUser,
        message: 'Vendor account created and verified successfully.',
      };
    } catch (error) {
      console.error('[AuthService vendorSignUp Admin Flow] Error:', error);
      throw new BadRequestException(error.message || 'Could not complete vendor sign up.');
    }
  }

  async bulkCreateVendors(vendors: Partial<VendorSignUpInput>[]): Promise<AuthResponse> {
    try {
      for (const vendor of vendors) {
        // Generate placeholder values for missing fields
        const email = vendor.email || `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@placeholder.com`;
        const phoneNumber = vendor.phoneNumber || `+94${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
        const secondaryPhoneNumber = vendor.secondaryPhoneNumber || `+94${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
        const password = `Vendor${Math.random().toString(36).substr(2, 8)}!1`;

        // Create vendor with generated values
        await this.vendorSignUp({
          ...vendor,
          email,
          phoneNumber,
          secondaryPhoneNumber,
          password,
          confirmPassword: password,
          termsAccepted: true,
        } as VendorSignUpInput);
      }

      return {
        message: 'Vendors created successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to create vendors');
    }
  }

  async vendorLogin(input: VendorLoginInput) {
    const clientId = this.configService.get<string>('COGNITO_CLIENT_CLIENT_ID');

    const authParameters: { [key: string]: string } = {
      USERNAME: input.email,
      PASSWORD: input.password,
    };

    // Check if account is locked
    const { locked, lockedUntil } = await this.loginAttemptService.isAccountLocked(input.email);
    if (locked) {
      throw new ForbiddenException(
        `Account is locked. Please try again after ${lockedUntil.toLocaleString()}`,
      );
    }

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: clientId,
        AuthParameters: authParameters,
      });
      const response = await this.cognitoClient.send(command);

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user || user.role !== UserRole.VENDOR) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Clear failed attempts on successful login
      await this.loginAttemptService.clearFailedAttempts(user.id);

      // Create session with ID token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // Sessions expire in 1 day

      await this.sessionService.createSession(
        user.id,
        response.AuthenticationResult.IdToken,
        expiresAt
      );

      return {
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      // Record failed attempt
      const { attemptsLeft, lockedUntil } = await this.loginAttemptService.recordFailedAttempt(input.email);

      if (lockedUntil) {
        throw new ForbiddenException(
          `Account is locked. Please try again after ${lockedUntil.toLocaleString()}`,
        );
      }

      throw new UnauthorizedException(
        `Invalid credentials. ${attemptsLeft} attempts remaining before account is locked.`,
      );
    }
  }

  // Temporary method for dummy user data
  async getDummyUsers(): Promise<any[]> { // Using any[] for now, will match DummyUserDto structure
    console.log('[AuthService] getDummyUsers called - returning dummy data.');
    return [
      {
        id: 'dummy-parent-001',
        firstName: 'Parent',
        lastName: 'One',
        email: 'parent1@example.com',
        role: 'PARENT',
      },
      {
        id: 'dummy-vendor-001',
        firstName: 'Vendor',
        lastName: 'Uno',
        email: 'vendor1@example.com',
        role: 'VENDOR',
      },
      {
        id: 'dummy-admin-001',
        firstName: 'Admin',
        lastName: 'Prime',
        email: 'admin1@example.com',
        role: 'ADMIN',
      },
      {
        id: 'dummy-parent-002',
        firstName: 'Parent',
        lastName: 'Two',
        email: 'parent2@example.com',
        role: 'PARENT',
      },
      {
        id: 'dummy-vendor-002',
        firstName: 'Vendor',
        lastName: 'Dos',
        email: 'vendor2@example.com',
        role: 'VENDOR',
      },
    ];
  }
} 