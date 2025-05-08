import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

describe('CurrentUser', () => {
  it('should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });

  it('should return user from request', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'STUDENT',
      cognitoId: 'test-cognito-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockContext = {
      getContext: () => ({ req: { user: mockUser } }),
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any);

    const result = CurrentUser(null, mockExecutionContext as ExecutionContext);

    expect(result).toEqual(mockUser);
    expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
  });
}); 