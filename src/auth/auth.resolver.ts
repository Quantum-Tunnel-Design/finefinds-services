import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { User } from '../users/models/user.model';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { ConfirmSignUpInput } from './dto/confirm-sign-up.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { ParentSignUpInput } from './dto/parent-sign-up.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponse } from './models/auth-response.model';
import { UpdateParentProfileInput } from './dto/update-parent-profile.input';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { User as PrismaUser, UserRole } from '@prisma/client';
import { OperationStatusDto } from '../common/dto/operation-status.dto';
import { UpdateParentPasswordInput } from './dto/update-parent-password.input';
import { AdminSignInInput } from './dto/admin-sign-in.input';
import { AdminAccountInput } from './dto/admin-account.input';
import { ResetAdminPasswordInput } from './dto/reset-admin-password.input';
import { VendorSignUpInput } from './dto/vendor-sign-up.input';
import { VendorLoginInput } from './dto/vendor-login.input';
import { BulkCreateVendorsInput } from './dto/bulk-create-vendors.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async signUp(@Args('input') input: SignUpInput): Promise<AuthResponse> {
    return this.authService.signUp(input);
  }

  @Mutation(() => AuthResponse)
  async parentSignUp(@Args('input') input: ParentSignUpInput): Promise<AuthResponse> {
    return this.authService.parentSignUp(input);
  }

  @Mutation(() => AuthResponse)
  async confirmSignUp(@Args('input') input: ConfirmSignUpInput): Promise<AuthResponse> {
    return this.authService.confirmSignUp(input);
  }

  @Mutation(() => AuthResponse)
  async signIn(@Args('input') input: SignInInput): Promise<AuthResponse> {
    return this.authService.signIn(input);
  }

  @Mutation(() => OperationStatusDto)
  async forgotPassword(@Args('input') input: ForgotPasswordInput): Promise<OperationStatusDto> {
    await this.authService.forgotPassword(input);
    return { success: true, message: 'If your email address exists in our system, you will receive a password reset link.' };
  }

  @Mutation(() => OperationStatusDto)
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<OperationStatusDto> {
    await this.authService.resetPassword(input);
    return { success: true, message: 'Your password has been reset successfully. Please log in with your new password.' };
  }

  @Mutation(() => AuthResponse, { name: 'adminSignIn' })
  async adminSignIn(
    @Args('input') input: AdminSignInInput,
  ): Promise<AuthResponse> {
    return this.authService.adminSignIn(input);
  }

  @Mutation(() => AuthResponse, { name: 'createAdminAccount' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAdminAccount(
    @Args('input') input: AdminAccountInput,
  ): Promise<AuthResponse> {
    return this.authService.createAdminAccount(input);
  }

  @Mutation(() => AuthResponse, { name: 'resetAdminPassword' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetAdminPassword(
    @Args('input') input: ResetAdminPasswordInput,
  ): Promise<AuthResponse> {
    return this.authService.resetAdminPassword(input.email, input.newPassword);
  }

  @Mutation(() => AuthResponse, { name: 'vendorSignUp' })
  async vendorSignUp(
    @Args('input') input: VendorSignUpInput,
  ): Promise<AuthResponse> {
    return this.authService.vendorSignUp(input);
  }

  @Mutation(() => AuthResponse, { name: 'vendorLogin' })
  async vendorLogin(
    @Args('input') input: VendorLoginInput,
  ): Promise<AuthResponse> {
    return this.authService.vendorLogin(input) as Partial<AuthResponse>;
  }

  @Mutation(() => AuthResponse, { name: 'bulkCreateVendors' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkCreateVendors(
    @Args('input') input: BulkCreateVendorsInput,
  ): Promise<AuthResponse> {
    return this.authService.bulkCreateVendors(input.vendors as Partial<VendorSignUpInput>[]);
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async updateMyParentProfile(
    @CurrentUser() user: PrismaUser,
    @Args('input') input: UpdateParentProfileInput,
  ): Promise<PrismaUser> {
    return this.authService.updateParentProfile(user.id, input) as unknown as PrismaUser;
  }

  @Mutation(() => OperationStatusDto)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async updateMyParentPassword(
    @CurrentUser() user: PrismaUser,
    @Args('input') input: UpdateParentPasswordInput,
  ): Promise<OperationStatusDto> {
    await this.authService.updateParentPassword(user.id, input);
    return { success: true, message: 'Password updated successfully.' };
  }

  @Mutation(() => OperationStatusDto)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: PrismaUser): Promise<OperationStatusDto> {
    await this.authService.logout(user.id);
    return { success: true, message: 'Logged out successfully' };
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: PrismaUser): Promise<PrismaUser> {
    return user;
  }
} 