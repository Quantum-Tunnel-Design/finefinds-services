import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import ConfigModule', () => {
    const configModule = module.select(AppModule).get('ConfigModule');
    expect(configModule).toBeDefined();
  });

  it('should import AuthModule', () => {
    const authModule = module.select(AppModule).get('AuthModule');
    expect(authModule).toBeDefined();
  });

  it('should import UsersModule', () => {
    const usersModule = module.select(AppModule).get('UsersModule');
    expect(usersModule).toBeDefined();
  });

  it('should import PrismaModule', () => {
    const prismaModule = module.select(AppModule).get('PrismaModule');
    expect(prismaModule).toBeDefined();
  });
}); 