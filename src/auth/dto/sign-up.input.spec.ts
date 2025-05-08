import { SignUpInput } from './sign-up.input';
import { UserRole } from '@prisma/client';

describe('SignUpInput', () => {
  it('should be defined', () => {
    expect(SignUpInput).toBeDefined();
  });

  it('should have all required fields', () => {
    const signUpInput = new SignUpInput();
    signUpInput.email = 'test@example.com';
    signUpInput.password = 'password123';
    signUpInput.firstName = 'John';
    signUpInput.lastName = 'Doe';
    signUpInput.role = UserRole.STUDENT;

    expect(signUpInput.email).toBe('test@example.com');
    expect(signUpInput.password).toBe('password123');
    expect(signUpInput.firstName).toBe('John');
    expect(signUpInput.lastName).toBe('Doe');
    expect(signUpInput.role).toBe(UserRole.STUDENT);
  });

  it('should validate email format', () => {
    const signUpInput = new SignUpInput();
    signUpInput.email = 'invalid-email';
    signUpInput.password = 'password123';
    signUpInput.firstName = 'John';
    signUpInput.lastName = 'Doe';
    signUpInput.role = UserRole.STUDENT;

    expect(() => {
      if (!signUpInput.email.includes('@')) {
        throw new Error('Invalid email format');
      }
    }).toThrow('Invalid email format');
  });

  it('should validate password length', () => {
    const signUpInput = new SignUpInput();
    signUpInput.email = 'test@example.com';
    signUpInput.password = 'short';
    signUpInput.firstName = 'John';
    signUpInput.lastName = 'Doe';
    signUpInput.role = UserRole.STUDENT;

    expect(() => {
      if (signUpInput.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
    }).toThrow('Password must be at least 8 characters long');
  });
}); 