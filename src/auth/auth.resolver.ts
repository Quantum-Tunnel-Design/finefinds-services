import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from '../users/models/user.model';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { ConfirmSignUpInput } from './dto/confirm-sign-up.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponse } from './models/auth-response.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async signUp(@Args('input') input: SignUpInput): Promise<AuthResponse> {
    return this.authService.signUp(input);
  }

  @Mutation(() => AuthResponse)
  async confirmSignUp(@Args('input') input: ConfirmSignUpInput): Promise<AuthResponse> {
    return this.authService.confirmSignUp(input);
  }

  @Mutation(() => AuthResponse)
  async signIn(@Args('input') input: SignInInput): Promise<AuthResponse> {
    return this.authService.signIn(input);
  }

  @Mutation(() => AuthResponse)
  async forgotPassword(@Args('input') input: ForgotPasswordInput): Promise<AuthResponse> {
    return this.authService.forgotPassword(input);
  }

  @Mutation(() => AuthResponse)
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<AuthResponse> {
    return this.authService.resetPassword(input);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User) {
    return user;
  }
} 