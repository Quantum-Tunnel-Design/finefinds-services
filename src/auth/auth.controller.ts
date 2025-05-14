import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ParentSignUpInput } from './dto/parent-sign-up.input';
import { AuthResponse } from './models/auth-response.model';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('parent/signup')
  async parentSignUp(@Body() input: ParentSignUpInput): Promise<AuthResponse> {
    return this.authService.parentSignUp(input);
  }
}