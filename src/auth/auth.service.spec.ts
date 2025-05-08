import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { ConfirmSignUpInput } from './dto/confirm-sign-up.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'AWS_REGION':
          return 'us-east-1';
        case 'COGNITO_USER_POOL_ID':
          return 'test-user-pool-id';
        case 'COGNITO_CLIENT_ID':
          return 'test-client-id';
        default:
          return null;
      }
    }),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByCognitoId: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should register a new user', async () => {
      const signUpInput: SignUpInput = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
      };

      const result = await service.signUp(signUpInput);

      expect(result).toEqual({
        message: 'User registered successfully. Please check your email for verification code.',
      });
    });
  });

  describe('signIn', () => {
    it('should sign in a user', async () => {
      const signInInput: SignInInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        cognitoId: 'test-cognito-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.signIn(signInInput);

      expect(result).toEqual({
        accessToken: expect.any(String),
        idToken: expect.any(String),
        refreshToken: expect.any(String),
        user: mockUser,
      });
    });
  });

  describe('confirmSignUp', () => {
    it('should confirm user registration', async () => {
      const confirmSignUpInput: ConfirmSignUpInput = {
        email: 'test@example.com',
        code: '123456',
      };

      const result = await service.confirmSignUp(confirmSignUpInput);

      expect(result).toEqual({
        message: 'Email verified successfully. You can now sign in.',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset', async () => {
      const forgotPasswordInput: ForgotPasswordInput = {
        email: 'test@example.com',
      };

      const result = await service.forgotPassword(forgotPasswordInput);

      expect(result).toEqual({
        message: 'Verification code sent to your email.',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const resetPasswordInput: ResetPasswordInput = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'newpassword123',
      };

      const result = await service.resetPassword(resetPasswordInput);

      expect(result).toEqual({
        message: 'Password reset successfully. You can now sign in with your new password.',
      });
    });
  });
}); 