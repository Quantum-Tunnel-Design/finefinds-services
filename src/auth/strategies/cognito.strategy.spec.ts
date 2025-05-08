import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CognitoStrategy } from './cognito.strategy';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('CognitoStrategy', () => {
  let strategy: CognitoStrategy;
  let usersService: UsersService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'AWS_REGION':
          return 'us-east-1';
        case 'COGNITO_USER_POOL_ID':
          return 'test-user-pool-id';
        default:
          return null;
      }
    }),
  };

  const mockUsersService = {
    findByCognitoId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CognitoStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<CognitoStrategy>(CognitoStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when found', async () => {
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

      mockUsersService.findByCognitoId.mockResolvedValue(mockUser);

      const result = await strategy.validate({ sub: 'test-cognito-id' });

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByCognitoId).toHaveBeenCalledWith('test-cognito-id');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockUsersService.findByCognitoId.mockResolvedValue(null);

      await expect(strategy.validate({ sub: 'test-cognito-id' })).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByCognitoId).toHaveBeenCalledWith('test-cognito-id');
    });
  });
}); 