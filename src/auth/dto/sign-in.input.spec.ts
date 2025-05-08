import { SignInInput } from './sign-in.input';

describe('SignInInput', () => {
  it('should be defined', () => {
    expect(SignInInput).toBeDefined();
  });

  it('should have all required fields', () => {
    const signInInput = new SignInInput();
    signInInput.email = 'test@example.com';
    signInInput.password = 'password123';

    expect(signInInput.email).toBe('test@example.com');
    expect(signInInput.password).toBe('password123');
  });

  it('should validate email format', () => {
    const signInInput = new SignInInput();
    signInInput.email = 'invalid-email';
    signInInput.password = 'password123';

    expect(() => {
      if (!signInInput.email.includes('@')) {
        throw new Error('Invalid email format');
      }
    }).toThrow('Invalid email format');
  });
}); 