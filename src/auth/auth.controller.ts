import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpInput } from './dto/sign-up.input';
import { SignInInput } from './dto/sign-in.input';
import { ConfirmSignUpInput } from './dto/confirm-sign-up.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { ParentSignUpInput } from './dto/parent-sign-up.input';
import { AdminSignInInput } from './dto/admin-sign-in.input';
import { AdminAccountInput } from './dto/admin-account.input';
import { UpdateParentProfileInput } from './dto/update-parent-profile.input';
import { UpdateParentPasswordInput } from './dto/update-parent-password.input';
import { AuthResponse } from './models/auth-response.model';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('parent/signup')
  async parentSignUp(@Body() input: ParentSignUpInput): Promise<AuthResponse> {
    return this.authService.parentSignUp(input);
  }

  @Post('admin/signin')
  async adminSignIn(@Body() input: AdminSignInInput): Promise<AuthResponse> {
    return this.authService.adminSignIn(input);
  }

  @Post('admin/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAdminAccount(@Body() input: AdminAccountInput): Promise<AuthResponse> {
    return this.authService.createAdminAccount(input);
  }

  @Post('admin/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetAdminPassword(
    @Body('email') email: string,
    @Body('newPassword') newPassword: string,
  ): Promise<AuthResponse> {
    return this.authService.resetAdminPassword(email, newPassword);
  }

  @Post('parent/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async updateParentProfile(
    @Req() req,
    @Body() input: UpdateParentProfileInput,
  ): Promise<AuthResponse> {
    return this.authService.updateParentProfile(req.user.id, input);
  }

  @Post('parent/password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  async updateParentPassword(
    @Req() req,
    @Body() input: UpdateParentPasswordInput,
  ): Promise<AuthResponse> {
    return this.authService.updateParentPassword(req.user.id, input);
  }
}