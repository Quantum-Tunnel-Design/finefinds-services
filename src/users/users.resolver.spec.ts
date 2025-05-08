import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: UsersService;

  const mockUsersService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('me', () => {
    it('should return the current user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        cognitoId: 'test-cognito-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await resolver.me(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('user', () => {
    it('should return a user by id', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        cognitoId: 'test-cognito-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await resolver.user('1');

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('1');
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const userId = '1';
      const firstName = 'Jane';
      const lastName = 'Smith';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName,
        lastName,
        role: UserRole.STUDENT,
        cognitoId: 'test-cognito-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await resolver.updateUser(userId, firstName, lastName);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, { firstName, lastName });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STUDENT,
        cognitoId: 'test-cognito-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.delete.mockResolvedValue(mockUser);

      const result = await resolver.deleteUser(userId);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.delete).toHaveBeenCalledWith(userId);
    });
  });
}); 