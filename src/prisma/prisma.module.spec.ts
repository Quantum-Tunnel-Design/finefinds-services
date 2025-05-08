import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from './prisma.module';

describe('PrismaModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get('PrismaService');
    expect(prismaService).toBeDefined();
  });

  it('should export PrismaService', () => {
    const prismaService = module.get('PrismaService');
    expect(prismaService).toBeDefined();
  });
}); 