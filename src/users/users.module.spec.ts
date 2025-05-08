import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide UsersService', () => {
    const usersService = module.get('UsersService');
    expect(usersService).toBeDefined();
  });

  it('should provide UsersResolver', () => {
    const usersResolver = module.get('UsersResolver');
    expect(usersResolver).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get('PrismaService');
    expect(prismaService).toBeDefined();
  });

  it('should export UsersService', () => {
    const usersService = module.get('UsersService');
    expect(usersService).toBeDefined();
  });
}); 