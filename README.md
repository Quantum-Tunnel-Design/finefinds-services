# FineFinds Education Platform

A modern education platform built with NestJS, GraphQL, PostgreSQL, and MongoDB.

## Features

- 🔐 Custom JWT Authentication
- 📚 Course Management
- 👥 User Management (Students, Parents, Vendors)
- 📅 Course Scheduling
- 💳 Payment Processing
- 📊 Analytics & Logging
- 🔔 Real-time Notifications

## Tech Stack

- **Backend Framework**: NestJS v10+
- **API**: GraphQL with Apollo Server
- **Database**: PostgreSQL (via Prisma ORM)
- **Caching**: Redis
- **Message Queue**: BullMQ
- **Logging**: MongoDB
- **Authentication**: Custom JWT
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (ECS, ECR, RDS)

## Prerequisites

- Node.js v18+
- PostgreSQL
- MongoDB
- Redis
- Docker (optional)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/finefinds?schema=public"

# MongoDB
MONGODB_URI="mongodb://localhost:27017/finefinds"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"

# App
PORT=3000
NODE_ENV="development"
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/finefinds.git
cd finefinds
```

2. Install dependencies:
```bash
npm install
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Seed the database (optional):
```bash
npm run prisma:seed
```

## Development

Start the development server:
```bash
npm run start:dev
```

The GraphQL playground will be available at `http://localhost:3000/graphql`.

## Testing

Run unit tests:
```bash
npm run test
```

Run e2e tests:
```bash
npm run test:e2e
```

## Docker

Build the Docker image:
```bash
docker build -t finefinds .
```

Run the container:
```bash
docker run -p 3000:3000 finefinds
```

## Deployment

The application is configured for deployment to AWS ECS using GitHub Actions. The workflow will:

1. Run tests
2. Build Docker image
3. Push to Amazon ECR
4. Deploy to ECS Fargate

## Project Structure

```
src/
├── auth/           # Authentication module
├── users/          # User management
├── courses/        # Course management
├── enrollments/    # Course enrollments
├── schedules/      # Course scheduling
├── reviews/        # Course reviews
├── payments/       # Payment processing
├── notifications/  # Notification system
├── logging/        # Logging service
└── prisma/         # Database schema and migrations
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Local Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18 or later
- AWS CLI (for LocalStack setup)

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finefinds.git
   cd finefinds
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the local environment:
   ```bash
   chmod +x scripts/setup-local.sh
   ./scripts/setup-local.sh
   ```

4. Start the application:
   ```bash
   docker-compose up app
   ```

The application will be available at http://localhost:3000

### Local Services

The following services are available locally:

- **Application**: http://localhost:3000
- **PostgreSQL**: localhost:5432
  - Username: postgres
  - Password: postgres
  - Database: finefinds
- **MongoDB**: localhost:27017
  - Database: finefinds
- **LocalStack**: http://localhost:4566
  - S3: http://localhost:4566
  - Secrets Manager: http://localhost:4566
  - Cognito: http://localhost:4566

### Environment Variables

Local environment variables are stored in `config/local.env`. This file is automatically loaded by Docker Compose.

### Development Workflow

1. Make changes to your code
2. The application will automatically reload (hot reloading is enabled)
3. Run tests: `npm test`
4. Build the application: `npm run build`

### Troubleshooting

1. **Database Connection Issues**
   ```bash
   docker-compose restart postgres mongodb
   ```

2. **LocalStack Issues**
   ```bash
   docker-compose restart localstack
   ./scripts/setup-local.sh
   ```

3. **Application Issues**
   ```bash
   docker-compose restart app
   ```

### Clean Up

To stop all services:
```bash
docker-compose down
```

To remove all data and start fresh:
```bash
docker-compose down -v
./scripts/setup-local.sh
``` 