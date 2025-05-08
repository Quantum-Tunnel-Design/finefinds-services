import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { ConfirmSignUpInput } from './dto/confirm-sign-up.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { UserRole } from '@prisma/client';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    confirmSignUp: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
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

      const expectedResponse = {
        message: 'User registered successfully. Please check your email for verification code.',
      };

      mockAuthService.signUp.mockResolvedValue(expectedResponse);

      const result = await resolver.signUp(signUpInput);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.signUp).toHaveBeenCalledWith(signUpInput);
    });
  });

  describe('signIn', () => {
    it('should sign in a user', async () => {
      const signInInput: SignInInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse = {
        accessToken: 'test-access-token',
        idToken: 'test-id-token',
        refreshToken: 'test-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.STUDENT,
          cognitoId: 'test-cognito-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockAuthService.signIn.mockResolvedValue(expectedResponse);

      const result = await resolver.signIn(signInInput);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.signIn).toHaveBeenCalledWith(signInInput);
    });
  });

  describe('confirmSignUp', () => {
    it('should confirm user registration', async () => {
      const confirmSignUpInput: ConfirmSignUpInput = {
        email: 'test@example.com',
        code: '123456',
      };

      const expectedResponse = {
        message: 'Email verified successfully. You can now sign in.',
      };

      mockAuthService.confirmSignUp.mockResolvedValue(expectedResponse);

      const result = await resolver.confirmSignUp(confirmSignUpInput);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.confirmSignUp).toHaveBeenCalledWith(confirmSignUpInput);
    });
  });

  describe('forgotPassword', () => {
    it('should initiate password reset', async () => {
      const forgotPasswordInput: ForgotPasswordInput = {
        email: 'test@example.com',
      };

      const expectedResponse = {
        message: 'Verification code sent to your email.',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResponse);

      const result = await resolver.forgotPassword(forgotPasswordInput);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(forgotPasswordInput);
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const resetPasswordInput: ResetPasswordInput = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'newpassword123',
      };

      const expectedResponse = {
        message: 'Password reset successfully. You can now sign in with your new password.',
      };

      mockAuthService.resetPassword.mockResolvedValue(expectedResponse);

      const result = await resolver.resetPassword(resetPasswordInput);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordInput);
    });
  });
}); 