#!/bin/bash
set -e

# Configuration - Update these values
AWS_REGION=${AWS_REGION:-"us-east-1"}
ECR_REPOSITORY_NAME=${ECR_REPOSITORY_NAME:-"finefinds-services"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

# Print configuration
echo "=== Deployment Configuration ==="
echo "AWS Region: $AWS_REGION"
echo "ECR Repository: $ECR_REPOSITORY_NAME"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "Image Tag: $IMAGE_TAG"
echo "==============================="

# Authenticate Docker to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create repository if it doesn't exist
echo "Creating ECR repository if it doesn't exist..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $AWS_REGION || aws ecr create-repository --repository-name $ECR_REPOSITORY_NAME --region $AWS_REGION

# Build Docker image with build arguments
echo "Building Docker image..."
docker build \
  --build-arg AWS_REGION=${AWS_REGION} \
  --build-arg COGNITO_CLIENT_USER_POOL_ID=${COGNITO_CLIENT_USER_POOL_ID} \
  --build-arg COGNITO_CLIENT_CLIENT_ID=${COGNITO_CLIENT_CLIENT_ID} \
  --build-arg COGNITO_ADMIN_USER_POOL_ID=${COGNITO_ADMIN_USER_POOL_ID} \
  --build-arg COGNITO_ADMIN_CLIENT_ID=${COGNITO_ADMIN_CLIENT_ID} \
  --build-arg JWT_SECRET=${JWT_SECRET} \
  -t $ECR_REPOSITORY_NAME:$IMAGE_TAG .

# Tag the image for ECR
echo "Tagging image for ECR..."
docker tag $ECR_REPOSITORY_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG

# Push the image to ECR
echo "Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG

echo "=== Deployment Complete ==="
echo "Image URI: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_NAME:$IMAGE_TAG" 