#!/bin/bash
set -e

# Environment to check
ENV=${1:-dev}

# Base URL for each environment
case "$ENV" in
  dev)
    BASE_URL="https://api-dev.finefinds.com"
    ;;
  qa)
    BASE_URL="https://api-qa.finefinds.com"
    ;;
  staging)
    BASE_URL="https://api-staging.finefinds.com"
    ;;
  prod)
    BASE_URL="https://api.finefinds.com"
    ;;
  *)
    echo "Unknown environment: $ENV"
    echo "Usage: $0 [dev|qa|staging|prod]"
    exit 1
    ;;
esac

echo "=== Testing Environment Variables for $ENV ==="
echo "Base URL: $BASE_URL"

# Check health endpoint
echo -n "Health check: "
curl -s "$BASE_URL/health" | jq '.'

# Check debug env endpoint
echo -n "Environment variables: "
curl -s "$BASE_URL/health/debug-env" | jq '.'

echo "=== Test Complete ===" 