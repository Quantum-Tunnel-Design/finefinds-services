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

@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse, { description: 'Registers a new student account in the system.' })
  async signUp(@Args('input') input: SignUpInput): Promise<AuthResponse> {
    return this.authService.signUp(input);
  }

  @Mutation(() => AuthResponse, { description: 'Registers a new parent account in the system.' })
  async parentSignUp(@Args('input') input: ParentSignUpInput): Promise<AuthResponse> {
    return this.authService.parentSignUp(input);
  }

  @Mutation(() => AuthResponse, { description: 'Confirms a user\'s registration using the verification code sent to their email.' })
  async confirmSignUp(@Args('input') input: ConfirmSignUpInput): Promise<AuthResponse> {
    return this.authService.confirmSignUp(input);
  }

  @Mutation(() => AuthResponse, { description: 'Authenticates a user and returns an access token.' })
  async signIn(@Args('input') input: SignInInput): Promise<AuthResponse> {
    return this.authService.signIn(input);
  }

  @Mutation(() => OperationStatusDto, { description: 'Initiates the password reset process by sending a reset code to the user\'s email.' })
  async forgotPassword(@Args('input') input: ForgotPasswordInput): Promise<OperationStatusDto> {
    await this.authService.forgotPassword(input);
    return { success: true, message: 'If your email address exists in our system, you will receive a password reset link.' };
  }

  @Mutation(() => OperationStatusDto, { description: 'Resets a user\'s password using the verification code sent to their email.' })
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<OperationStatusDto> {
    await this.authService.resetPassword(input);
    return { success: true, message: 'Your password has been reset successfully. Please log in with your new password.' };
  }

  @Mutation(() => AuthResponse, { 
    name: 'adminSignIn',
    description: 'Authenticates an admin user and returns an access token.'
  })
  async adminSignIn(
    @Args('input') input: AdminSignInInput,
  ): Promise<AuthResponse> {
    return this.authService.adminSignIn(input);
  }

  @Mutation(() => AuthResponse, { 
    name: 'createAdminAccount',
    description: 'Creates a new admin account. Requires ADMIN privileges.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAdminAccount(
    @Args('input') input: AdminAccountInput,
  ): Promise<AuthResponse> {
    return this.authService.createAdminAccount(input);
  }

  @Mutation(() => AuthResponse, { 
    name: 'resetAdminPassword',
    description: 'Resets an admin user\'s password. Requires ADMIN privileges.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetAdminPassword(
    @Args('input') input: ResetAdminPasswordInput,
  ): Promise<AuthResponse> {
    return this.authService.resetAdminPassword(input.email, input.newPassword);
  }

  @Mutation(() => AuthResponse, { 
    name: 'vendorSignUp',
    description: 'Registers a new vendor account in the system.'
  })
  async vendorSignUp(
    @Args('input') input: VendorSignUpInput,
  ): Promise<AuthResponse> {
    return this.authService.vendorSignUp(input);
  }

  @Mutation(() => AuthResponse, { 
    name: 'vendorLogin',
    description: 'Authenticates a vendor and returns an access token.'
  })
  async vendorLogin(
    @Args('input') input: VendorLoginInput,
  ): Promise<AuthResponse> {
    return this.authService.vendorLogin(input) as Partial<AuthResponse>;
  }

  @Mutation(() => AuthResponse, { 
    name: 'bulkCreateVendors',
    description: 'Creates multiple vendor accounts in bulk. Requires ADMIN privileges.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async bulkCreateVendors(
    @Args('input') input: BulkCreateVendorsInput,
  ): Promise<AuthResponse> {
    return this.authService.bulkCreateVendors(input.vendors as Partial<VendorSignUpInput>[]);
  }

  @Mutation(() => User, { 
    description: 'Updates the profile of the currently authenticated parent user.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async updateMyParentProfile(
    @CurrentUser() user: PrismaUser,
    @Args('input') input: UpdateParentProfileInput,
  ): Promise<User> {
    const updatedUser = await this.authService.updateParentProfile(user.id, input);
    return updatedUser as any as User;
  }

  @Mutation(() => OperationStatusDto, { 
    description: 'Updates the password of the currently authenticated parent user.'
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async updateMyParentPassword(
    @CurrentUser() user: PrismaUser,
    @Args('input') input: UpdateParentPasswordInput,
  ): Promise<OperationStatusDto> {
    await this.authService.updateParentPassword(user.id, input);
    return { success: true, message: 'Password updated successfully.' };
  }

  @Mutation(() => OperationStatusDto, { 
    description: 'Logs out the currently authenticated user and invalidates their session.'
  })
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: PrismaUser): Promise<OperationStatusDto> {
    await this.authService.logout(user.id);
    return { success: true, message: 'Logged out successfully' };
  }

  @Query(() => User, { 
    description: 'Retrieves the profile of the currently authenticated user.'
  })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: PrismaUser): Promise<User> {
    return user as any as User;
  }
} 