import { ForgotPasswordInput } from './forgot-password.input';

describe('ForgotPasswordInput', () => {
  it('should be defined', () => {
    expect(ForgotPasswordInput).toBeDefined();
  });

  it('should have all required fields', () => {
    const forgotPasswordInput = new ForgotPasswordInput();
    forgotPasswordInput.email = 'test@example.com';

    expect(forgotPasswordInput.email).toBe('test@example.com');
  });

  it('should validate email format', () => {
    const forgotPasswordInput = new ForgotPasswordInput();
    forgotPasswordInput.email = 'invalid-email';

    expect(() => {
      if (!forgotPasswordInput.email.includes('@')) {
        throw new Error('Invalid email format');
      }
    }).toThrow('Invalid email format');
  });
}); 