import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Middleware for GraphQL file uploads - Removed as we use REST for file uploads
  // app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  // Enable compression
  app.use(compression());

  // Get frontend URLs from environment variables
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
  const adminFrontendUrl = process.env.ADMIN_FRONTEND_URL || 'http://localhost:4001';
  const apolloStudioUrl = 'https://studio.apollographql.com';
  const isLocal = !(['prod', 'production', 'staging'].includes(process.env.NODE_ENV));
  
  // Function to get both HTTP and HTTPS versions of a URL
  const getUrlVariants = (url: string) => {
    if (!url) return [];
    const variants = [url];
    if (url.startsWith('https://')) {
      variants.push(url.replace('https://', 'http://'));
    } else if (url.startsWith('http://')) {
      variants.push(url.replace('http://', 'https://'));
    }
    return variants;
  };

  // Get all URL variants
  const allowedOrigins = [
    ...getUrlVariants(backendUrl),
    ...getUrlVariants(frontendUrl),
    ...getUrlVariants(adminFrontendUrl)
  ];
  
  if (isLocal) {
    allowedOrigins.push(apolloStudioUrl);
  }
  
  logger.log('Environment:', process.env.NODE_ENV || 'development');
  logger.log('Allowed CORS origins:', allowedOrigins);

  // Enable CORS with specific configuration for credentialed requests
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked request from disallowed origin: ${origin}`);
        logger.debug('Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix for all routes except health
  app.setGlobalPrefix('api', {
    exclude: ['/health(.*)', '/api/docs'],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('FineFinds API')
    .setDescription('The FineFinds Education Platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('courses', 'Course management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'FineFinds API Documentation',
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);
}

bootstrap();