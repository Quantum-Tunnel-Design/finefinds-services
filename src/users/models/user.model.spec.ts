import { User } from './user.model';
import { UserRole } from '@prisma/client';

describe('User', () => {
  it('should be defined', () => {
    expect(User).toBeDefined();
  });

  it('should have all required fields', () => {
    const user = new User();
    user.id = '1';
    user.email = 'test@example.com';
    user.firstName = 'John';
    user.lastName = 'Doe';
    user.role = UserRole.STUDENT;
    user.cognitoId = 'test-cognito-id';
    user.createdAt = new Date();
    user.updatedAt = new Date();

    expect(user.id).toBe('1');
    expect(user.email).toBe('test@example.com');
    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.role).toBe(UserRole.STUDENT);
    expect(user.cognitoId).toBe('test-cognito-id');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });
}); 