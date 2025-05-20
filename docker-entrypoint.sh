#!/bin/sh
# Log environment variables for debugging purposes

echo "=== Environment Variables ==="
echo "NODE_ENV: $NODE_ENV"
echo "AWS_REGION: $AWS_REGION"
echo "PORT: $PORT"

# Cognito variables
echo "COGNITO_CLIENT_USER_POOL_ID: ${COGNITO_CLIENT_USER_POOL_ID:-Not set}"
echo "COGNITO_CLIENT_CLIENT_ID: ${COGNITO_CLIENT_CLIENT_ID:-Not set}"
echo "COGNITO_ADMIN_USER_POOL_ID: ${COGNITO_ADMIN_USER_POOL_ID:-Not set}"
echo "COGNITO_ADMIN_CLIENT_ID: ${COGNITO_ADMIN_CLIENT_ID:-Not set}"

# Check if other important environment variables are set
echo "JWT_SECRET set: $(if [ -z "$JWT_SECRET" ]; then echo "No"; else echo "Yes"; fi)"
echo "DATABASE_URL set: $(if [ -z "$DATABASE_URL" ]; then echo "No"; else echo "Yes"; fi)"
echo "MONGODB_URI set: $(if [ -z "$MONGODB_URI" ]; then echo "No"; else echo "Yes"; fi)"
echo "REDIS_URL set: $(if [ -z "$REDIS_URL" ]; then echo "No"; else echo "Yes"; fi)"
echo "============================="

# Start the application
exec node dist/src/main.js 