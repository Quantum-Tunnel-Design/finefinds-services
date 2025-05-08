#!/bin/bash

# Create necessary directories
mkdir -p .localstack/data

# Start the services
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Initialize LocalStack
echo "Initializing LocalStack..."
aws --endpoint-url=http://localhost:4566 s3 mb s3://finefinds-local
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret --name /finefinds/local/DATABASE_URL --secret-string "postgresql://postgres:postgres@postgres:5432/finefinds"
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret --name /finefinds/local/MONGODB_URI --secret-string "mongodb://mongodb:27017/finefinds"
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret --name /finefinds/local/JWT_SECRET --secret-string "local_development_secret"

# Initialize PostgreSQL
echo "Initializing PostgreSQL..."
docker-compose exec postgres psql -U postgres -d finefinds -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Initialize MongoDB
echo "Initializing MongoDB..."
docker-compose exec mongodb mongosh --eval "db = db.getSiblingDB('finefinds'); db.createCollection('users'); db.createCollection('items');"

echo "Local environment setup complete!"
echo "You can now run the application with: docker-compose up app" 