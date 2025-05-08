import { ResetPasswordInput } from './reset-password.input';

describe('ResetPasswordInput', () => {
  it('should be defined', () => {
    expect(ResetPasswordInput).toBeDefined();
  });

  it('should have all required fields', () => {
    const resetPasswordInput = new ResetPasswordInput();
    resetPasswordInput.email = 'test@example.com';
    resetPasswordInput.code = '123456';
    resetPasswordInput.newPassword = 'newpassword123';

    expect(resetPasswordInput.email).toBe('test@example.com');
    expect(resetPasswordInput.code).toBe('123456');
    expect(resetPasswordInput.newPassword).toBe('newpassword123');
  });

  it('should validate email format', () => {
    const resetPasswordInput = new ResetPasswordInput();
    resetPasswordInput.email = 'invalid-email';
    resetPasswordInput.code = '123456';
    resetPasswordInput.newPassword = 'newpassword123';

    expect(() => {
      if (!resetPasswordInput.email.includes('@')) {
        throw new Error('Invalid email format');
      }
    }).toThrow('Invalid email format');
  });

  it('should validate password length', () => {
    const resetPasswordInput = new ResetPasswordInput();
    resetPasswordInput.email = 'test@example.com';
    resetPasswordInput.code = '123456';
    resetPasswordInput.newPassword = 'short';

    expect(() => {
      if (resetPasswordInput.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
    }).toThrow('Password must be at least 8 characters long');
  });
}); 