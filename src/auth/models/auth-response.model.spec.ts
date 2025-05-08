import { AuthResponse } from './auth-response.model';
import { User } from '../../users/models/user.model';
import { UserRole } from '@prisma/client';

describe('AuthResponse', () => {
  it('should be defined', () => {
    expect(AuthResponse).toBeDefined();
  });

  it('should have all required fields', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      cognitoId: 'test-cognito-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const authResponse = new AuthResponse();
    authResponse.accessToken = 'test-access-token';
    authResponse.idToken = 'test-id-token';
    authResponse.refreshToken = 'test-refresh-token';
    authResponse.user = mockUser;
    authResponse.message = 'Test message';

    expect(authResponse.accessToken).toBe('test-access-token');
    expect(authResponse.idToken).toBe('test-id-token');
    expect(authResponse.refreshToken).toBe('test-refresh-token');
    expect(authResponse.user).toEqual(mockUser);
    expect(authResponse.message).toBe('Test message');
  });
}); 