import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminUpdateUserAttributesCommand,
  ChangePasswordCommand,
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
import { UserRole } from '@prisma/client';
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
  private clientUserPoolId: string;
  private clientId: string;
  private adminUserPoolId: string;
  private adminClientId: string;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private sessionService: SessionService,
    private mailerService: MailerService,
    private prisma: PrismaService,
    private loginAttemptService: LoginAttemptService,
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get('AWS_REGION'),
    });
    this.clientUserPoolId = this.configService.get('COGNITO_CLIENT_USER_POOL_ID');
    this.clientId = this.configService.get('COGNITO_CLIENT_CLIENT_ID');
    this.adminUserPoolId = this.configService.get('COGNITO_ADMIN_USER_POOL_ID');
    this.adminClientId = this.configService.get('COGNITO_ADMIN_CLIENT_ID');
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
      const user = await this.usersService.findByEmail(input.email);
      if (user?.role === UserRole.ADMIN) {
        throw new ForbiddenException('Password reset is not allowed for admin accounts');
      }

      // Check if user exists
      if (!user) {
        // Return success even if user doesn't exist for security
        return {
          message: 'If an account exists with this email, you will receive a password reset code.',
        };
      }

      const forgotPasswordCommand = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: input.email,
      });

      await this.cognitoClient.send(forgotPasswordCommand);

      return {
        message: 'If an account exists with this email, you will receive a password reset code.',
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      return {
        message: 'If an account exists with this email, you will receive a password reset code.',
      };
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
    try {
      // Validate password match
      if (input.newPassword !== input.confirmNewPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Check if user exists
      const user = await this.usersService.findByEmail(input.email);
      if (!user) {
        throw new BadRequestException('Invalid reset code or email');
      }

      const confirmForgotPasswordCommand = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: input.email,
        ConfirmationCode: input.code,
        Password: input.newPassword,
      });

      await this.cognitoClient.send(confirmForgotPasswordCommand);

      // Delete any existing sessions for this user
      await this.sessionService.deleteUserSessions(user.id);

      return {
        message: 'Password reset successfully. You can now sign in with your new password.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid reset code or email');
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
        UserPoolId: this.clientUserPoolId,
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

  async adminSignIn(input: AdminSignInInput): Promise<AuthResponse> {
    try {
      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: this.adminUserPoolId,
        ClientId: this.adminClientId,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: input.username,
          PASSWORD: input.password,
        },
      });

      const response = await this.cognitoClient.send(authCommand);
      const user = await this.usersService.findByEmail(input.username);

      if (!response.AuthenticationResult?.AccessToken) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // Admin sessions expire in 1 day

      await this.sessionService.createSession(
        user.id,
        response.AuthenticationResult.AccessToken,
        expiresAt
      );

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

  async createAdminAccount(input: AdminAccountInput): Promise<AuthResponse> {
    try {
      // Check if admin already exists
      const existingAdmin = await this.usersService.findByEmail(input.email);
      if (existingAdmin) {
        throw new BadRequestException('Admin account already exists');
      }

      // Create admin user in Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: this.adminUserPoolId,
        Username: input.email,
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: input.firstName },
          { Name: 'family_name', Value: input.lastName },
          { Name: 'custom:role', Value: UserRole.ADMIN },
        ],
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      await this.cognitoClient.send(createUserCommand);

      // Set admin password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.adminUserPoolId,
        Username: input.email,
        Password: input.password,
        Permanent: true,
      });

      await this.cognitoClient.send(setPasswordCommand);

      // Add to admin group
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: this.adminUserPoolId,
        Username: input.email,
        GroupName: 'admin',
      });

      await this.cognitoClient.send(addToGroupCommand);

      // Create admin in database
      await this.usersService.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.ADMIN,
        cognitoSub: input.email, // Using email as cognitoSub for admin
      });

      return {
        message: 'Admin account created successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException(error.message);
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
        UserPoolId: this.adminUserPoolId,
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
        UserPoolId: this.clientUserPoolId,
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
    try {
      const user = await this.usersService.findById(userId);
      if (!user || user.role !== UserRole.PARENT) {
        throw new ForbiddenException('User not found or not a parent');
      }

      // Validate password match
      if (input.newPassword !== input.confirmNewPassword) {
        throw new BadRequestException('New passwords do not match');
      }

      // Verify current password
      try {
        const authCommand = new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: user.email,
            PASSWORD: input.currentPassword,
          },
        });

        await this.cognitoClient.send(authCommand);
      } catch (error) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Update password in Cognito using admin API
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.clientUserPoolId,
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
    try {
      // Validate password match
      if (input.password !== input.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Validate terms acceptance
      if (!input.termsAccepted) {
        throw new BadRequestException('Terms and conditions must be accepted');
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
          { Name: 'custom:secondary_phone', Value: input.secondaryPhoneNumber },
          { Name: 'custom:role', Value: UserRole.VENDOR },
        ],
      });

      const cognitoResponse = await this.cognitoClient.send(signUpCommand);

      // Add user to vendor group
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: this.clientUserPoolId,
        Username: input.email,
        GroupName: 'vendor',
      });

      await this.cognitoClient.send(addToGroupCommand);

      // Create user in database
      const user = await this.usersService.create({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: UserRole.VENDOR,
        cognitoSub: cognitoResponse.UserSub,
        phoneNumber: input.phoneNumber,
        secondaryPhoneNumber: input.secondaryPhoneNumber,
      });

      // Send confirmation email to vendor
      await this.mailerService.sendMail({
        to: input.email,
        subject: 'Welcome to FineFinds - Vendor Registration',
        template: 'vendor-welcome',
        context: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });

      // Send notification to admin
      const adminEmail = this.configService.get('ADMIN_EMAIL');
      await this.mailerService.sendMail({
        to: adminEmail,
        subject: 'New Vendor Registration',
        template: 'vendor-registration-notification',
        context: {
          vendorName: `${input.firstName} ${input.lastName}`,
          vendorEmail: input.email,
          vendorPhone: input.phoneNumber,
        },
      });

      return {
        message: 'Vendor registered successfully. Please check your email for verification code.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException(error.message);
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
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: input.password,
        },
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

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // Sessions expire in 1 day

      await this.sessionService.createSession(
        user.id,
        response.AuthenticationResult.AccessToken,
        expiresAt
      );

      return {
        accessToken: response.AuthenticationResult.AccessToken,
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
} 