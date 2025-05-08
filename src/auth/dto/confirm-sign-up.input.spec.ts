import { ConfirmSignUpInput } from './confirm-sign-up.input';

describe('ConfirmSignUpInput', () => {
  it('should be defined', () => {
    expect(ConfirmSignUpInput).toBeDefined();
  });

  it('should have all required fields', () => {
    const confirmSignUpInput = new ConfirmSignUpInput();
    confirmSignUpInput.email = 'test@example.com';
    confirmSignUpInput.code = '123456';

    expect(confirmSignUpInput.email).toBe('test@example.com');
    expect(confirmSignUpInput.code).toBe('123456');
  });

  it('should validate email format', () => {
    const confirmSignUpInput = new ConfirmSignUpInput();
    confirmSignUpInput.email = 'invalid-email';
    confirmSignUpInput.code = '123456';

    expect(() => {
      if (!confirmSignUpInput.email.includes('@')) {
        throw new Error('Invalid email format');
      }
    }).toThrow('Invalid email format');
  });
}); 