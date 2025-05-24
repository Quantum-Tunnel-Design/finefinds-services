import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class AwsConfigService {
  private cognitoClient: CognitoIdentityProviderClient;
  private cognitoConfig: {
    client: {
      userPoolId: string;
      clientId: string;
    };
    admin: {
      userPoolId: string;
      clientId: string;
    };
    region: string;
  };

  constructor(private configService: ConfigService) {
    const awsRegion = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    
    if (!awsRegion) {
      throw new Error('Missing AWS_REGION configuration. Check environment variables.');
    }

    // Initialize Cognito client with default credential provider chain
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: awsRegion,
    });

    // Load both client and admin pool configurations
    this.cognitoConfig = {
      client: {
        userPoolId: this.configService.get<string>('COGNITO_CLIENT_USER_POOL_ID'),
        clientId: this.configService.get<string>('COGNITO_CLIENT_CLIENT_ID'),
      },
      admin: {
        userPoolId: this.configService.get<string>('COGNITO_ADMIN_USER_POOL_ID'),
        clientId: this.configService.get<string>('COGNITO_ADMIN_CLIENT_ID'),
      },
      region: awsRegion,
    };

    // Validate required configurations
    if (!this.cognitoConfig.client.userPoolId || !this.cognitoConfig.client.clientId) {
      throw new Error('Missing Cognito client pool configuration. Check COGNITO_CLIENT_USER_POOL_ID and COGNITO_CLIENT_CLIENT_ID environment variables.');
    }

    if (!this.cognitoConfig.admin.userPoolId || !this.cognitoConfig.admin.clientId) {
      throw new Error('Missing Cognito admin pool configuration. Check COGNITO_ADMIN_USER_POOL_ID and COGNITO_ADMIN_CLIENT_ID environment variables.');
    }
  }

  getCognitoClient(): CognitoIdentityProviderClient {
    return this.cognitoClient;
  }

  getCognitoConfig() {
    return this.cognitoConfig;
  }

  getClientPoolConfig() {
    return this.cognitoConfig.client;
  }

  getAdminPoolConfig() {
    return this.cognitoConfig.admin;
  }
} 