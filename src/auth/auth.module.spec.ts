import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AuthService', () => {
    const authService = module.get('AuthService');
    expect(authService).toBeDefined();
  });

  it('should provide AuthResolver', () => {
    const authResolver = module.get('AuthResolver');
    expect(authResolver).toBeDefined();
  });

  it('should provide CognitoStrategy', () => {
    const cognitoStrategy = module.get('CognitoStrategy');
    expect(cognitoStrategy).toBeDefined();
  });
}); 