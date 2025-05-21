#!/bin/bash
set -e

# Function to create task definition JSON
create_task_definition() {
    local env=$1
    local task_def_family=$2
    local execution_role="finefinds-$env-ecs-execution-role"
    local task_role="finefinds-$env-ecs-task-role"
    
    echo "Verifying IAM roles..."
    if ! aws iam get-role --role-name "$execution_role" > /dev/null 2>&1; then
        echo "::error::Execution role $execution_role does not exist"
        return 1
    fi
    if ! aws iam get-role --role-name "$task_role" > /dev/null 2>&1; then
        echo "::error::Task role $task_role does not exist"
        return 1
    fi
    
    local execution_role_arn=$(aws iam get-role --role-name "$execution_role" --query 'Role.Arn' --output text)
    local task_role_arn=$(aws iam get-role --role-name "$task_role" --query 'Role.Arn' --output text)
    
    if [ -z "$execution_role_arn" ] || [ -z "$task_role_arn" ]; then
        echo "::error::Failed to get role ARNs"
        return 1
    fi
    
    echo "Using execution role: $execution_role_arn"
    echo "Using task role: $task_role_arn"
    
    # Get database connection secret ARN
    local db_connection_arn=$(aws secretsmanager get-secret-value \
        --secret-id "finefinds-$env-rds-connection" \
        --query 'ARN' \
        --output text)
    
    if [ -z "$db_connection_arn" ]; then
        echo "::error::Failed to get database connection secret ARN"
        return 1
    fi
    
    echo "Using database connection secret ARN: $db_connection_arn"
    echo "db_connection_arn=$db_connection_arn" >> $GITHUB_OUTPUT
    
    # Create task definition JSON
    cat > task-definition.json << EOF
{
  "family": "$task_def_family",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$execution_role_arn",
  "taskRoleArn": "$task_role_arn",
  "runtimePlatform": {
    "operatingSystemFamily": "LINUX",
    "cpuArchitecture": "X86_64"
  },
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["$SUBNET_IDS"],
      "securityGroups": ["$SECURITY_GROUP_IDS"],
      "assignPublicIp": "DISABLED"
    }
  },
  "proxyConfiguration": {
    "type": "APPMESH",
    "containerName": "envoy",
    "properties": [
      {"name": "IgnoredUID", "value": "1337"},
      {"name": "ProxyIngressPort", "value": "15000"},
      {"name": "ProxyEgressPort", "value": "15001"},
      {"name": "AppPorts", "value": "3000"},
      {"name": "EgressIgnoredIPs", "value": "169.254.170.2,169.254.169.254"}
    ]
  },
  "containerDefinitions": [
    {
      "name": "envoy",
      "image": "$ECR_REPOSITORY_ENVOY:$ECR_ENVOY_IMAGE_TAG",
      "essential": true,
      "user": "1337",
      "environment": [
        {"name": "APPMESH_VIRTUAL_NODE_NAME", "value": "mesh/$MESH_NAME/virtualNode/$VIRTUAL_NODE_NAME"},
        {"name": "ENABLE_ENVOY_STATS_TAGS", "value": "1"},
        {"name": "ENABLE_ENVOY_XRAY_TRACING", "value": "1"},
        {"name": "APPMESH_PREVIEW", "value": "0"}
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -s http://localhost:9901/server_info | grep state | grep -q LIVE"],
        "interval": 5,
        "timeout": 2,
        "retries": 3,
        "startPeriod": 10
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "$LOG_GROUP_ENVOY",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "envoy"
        }
      }
    },
    {
      "name": "AppContainer",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY_BACKEND:latest",
      "essential": true,
      "workingDirectory": "/app",
      "entryPoint": ["node"],
      "command": ["dist/src/main.js"],
      "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
      "environment": [
        {"name": "PORT", "value": "3000"},
        {"name": "NODE_ENV", "value": "$SERVICES_ENV"},
        {"name": "AWS_REGION", "value": "$AWS_REGION"},
        {"name": "APPMESH_VIRTUAL_NODE_NAME", "value": "mesh/$MESH_NAME/virtualNode/$VIRTUAL_NODE_NAME"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "$db_connection_arn"},
        {"name": "REDIS_URL", "valueFrom": "$REDIS_CONNECTION_ARN"},
        {"name": "JWT_SECRET", "valueFrom": "$JWT_SECRET_ARN"}
      ],
      "environment": [
        {"name": "COGNITO_CLIENT_USER_POOL_ID", "value": "$COGNITO_CLIENT_USER_POOL_ID"},
        {"name": "COGNITO_CLIENT_CLIENT_ID", "value": "$COGNITO_CLIENT_CLIENT_ID"},
        {"name": "COGNITO_ADMIN_USER_POOL_ID", "value": "$COGNITO_ADMIN_USER_POOL_ID"},
        {"name": "COGNITO_ADMIN_CLIENT_ID", "value": "$COGNITO_ADMIN_CLIENT_ID"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "$LOG_GROUP_APP",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "finefinds"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF
}

# Function to clean up old task definitions
cleanup_old_task_defs() {
    local family=$1
    local keep_count=5
    echo "Cleaning up old task definitions for family: $family"
    
    # Get all task definitions for the family
    local task_defs=($(aws ecs list-task-definitions \
        --family-prefix "$family" \
        --sort DESC \
        --query 'taskDefinitionArns[]' \
        --output text))
    
    # Keep the most recent ones
    local keep_defs=("${task_defs[@]:0:$keep_count}")
    echo "Keeping task definitions:"
    for def in "${keep_defs[@]}"; do
        echo "  $def"
    done
    
    # Deregister the rest
    local deregister_defs=("${task_defs[@]:$keep_count}")
    if [ ${#deregister_defs[@]} -gt 0 ]; then
        echo "Deregistering old task definitions:"
        for def in "${deregister_defs[@]}"; do
            echo "  Deregistering: $def"
            aws ecs deregister-task-definition --task-definition "$def" || {
                echo "::warning::Failed to deregister task definition: $def"
                continue
            }
        done
    else
        echo "No old task definitions to deregister"
    fi
}

# Main script execution
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <environment> <task-definition-family>"
    exit 1
fi

ENV=$1
TASK_DEF_FAMILY=$2

# Create task definition
if ! create_task_definition "$ENV" "$TASK_DEF_FAMILY"; then
    exit 1
fi

# Validate task definition JSON
if ! jq . task-definition.json > /dev/null 2>&1; then
    echo "::error::Invalid JSON in task definition"
    cat task-definition.json
    exit 1
fi

# Register task definition
echo "Registering task definition..."
NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://task-definition.json \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)
    
if [ $? -ne 0 ] || [ -z "$NEW_TASK_DEF_ARN" ]; then
    echo "::error::Failed to register task definition"
    echo "Task definition JSON:"
    cat task-definition.json
    exit 1
fi

echo "task_def_arn=$NEW_TASK_DEF_ARN" >> $GITHUB_OUTPUT

# Clean up old task definitions
cleanup_old_task_defs "$TASK_DEF_FAMILY" 