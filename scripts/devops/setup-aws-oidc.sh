#!/bin/bash

set -e

# Set AWS region
export AWS_REGION=${AWS_REGION:-us-east-1}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
OIDC_ARN="arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"

# Define repositories and their environments
REPOS=(
    "finefinds-services:Backend Service:services"
    "finefinds-client-web-app:Client Web App:client"
    "finefinds-admin:Admin App:admin"
    "finefinds-devops-cicd:DevOps Project:devops"
)

ENVIRONMENTS=("dev" "qa" "staging" "prod" "sandbox")

# Function to create trust policy for a repo and environment
create_trust_policy() {
    local repo=$1
    local env=$2
    local policy_file="trust-policy-${repo}-${env}.json"
    
    cat > $policy_file <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "$OIDC_ARN"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": [
                        "repo:Quantum-Tunnel-Design/${repo}:environment:${env}",
                        "repo:Quantum-Tunnel-Design/${repo}:ref:refs/heads/${env}"
                    ]
                },
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                }
            }
        }
    ]
}
EOF
    echo $policy_file
}

# Function to create role policy
create_role_policy() {
    local repo=$1
    local env=$2
    local policy_file="role-policy-${repo}-${env}.json"
    
    echo "Creating policy for repo: $repo, env: $env" >&2
    echo "AWS Region: $AWS_REGION" >&2
    echo "Account ID: $ACCOUNT_ID" >&2
    
    cat > $policy_file <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetRepositoryPolicy",
                "ecr:DescribeRepositories",
                "ecr:ListImages",
                "ecr:DescribeImages",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage",
                "ecr:CreateRepository",
                "ecr:DeleteRepository",
                "ecr:SetRepositoryPolicy",
                "ecr:DeleteRepositoryPolicy",
                "ecr:TagResource",
                "ecr:UntagResource",
                "ecr:DescribeImages",
                "ecr:ListTagsForResource"
            ],
            "Resource": [
                "arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${repo}-${env}",
                "arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${repo}-${env}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecs:DescribeTaskDefinition",
                "ecs:ListTaskDefinitions"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecs:UpdateService",
                "ecs:DescribeServices",
                "ecs:DescribeTaskDefinition",
                "ecs:DescribeTasks",
                "ecs:ListTasks",
                "ecs:RegisterTaskDefinition",
                "ecs:CreateService",
                "ecs:DeleteService",
                "ecs:ListServices",
                "ecs:ListTaskDefinitions",
                "ecs:ListClusters"
            ],
            "Resource": [
                "arn:aws:ecs:${AWS_REGION}:${ACCOUNT_ID}:cluster/finefinds-${env}",
                "arn:aws:ecs:${AWS_REGION}:${ACCOUNT_ID}:service/finefinds-${env}-cluster/*",
                "arn:aws:ecs:${AWS_REGION}:${ACCOUNT_ID}:task-definition/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": [
                "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
                "arn:aws:iam::${ACCOUNT_ID}:role/ecsInstanceRole",
                "arn:aws:iam::${ACCOUNT_ID}:role/finefinds-dev-ecs-task-role",
                "arn:aws:iam::${ACCOUNT_ID}:role/finefinds-dev-ecs-execution-role"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams"
            ],
            "Resource": [
                "arn:aws:logs:${AWS_REGION}:${ACCOUNT_ID}:log-group:/ecs/finefinds-backend:*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricAlarm",
                "cloudwatch:DeleteAlarms",
                "cloudwatch:DescribeAlarms"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "sns:CreateTopic",
                "sns:Subscribe",
                "sns:SetTopicAttributes",
                "sns:GetTopicAttributes",
                "sns:ListSubscriptionsByTopic",
                "sns:Publish"
            ],
            "Resource": "*"
        }
    ]
}
EOF
    echo "Created policy file: $policy_file" >&2
    echo "$policy_file"
}

# Clean up existing roles and OIDC provider
echo "Cleaning up existing roles and OIDC provider..."

# Delete existing OIDC provider
aws iam delete-open-id-connect-provider --open-id-connect-provider-arn $OIDC_ARN || true

# Delete existing roles
for role in $(aws iam list-roles --query "Roles[?starts_with(RoleName, 'github-actions-')].RoleName" --output text); do
    echo "Processing role: $role"
    # Detach managed policies
    for policy_arn in $(aws iam list-attached-role-policies --role-name $role --query "AttachedPolicies[].PolicyArn" --output text); do
        aws iam detach-role-policy --role-name $role --policy-arn $policy_arn || true
    done
    # Delete inline policies
    for policy_name in $(aws iam list-role-policies --role-name $role --query "PolicyNames" --output text); do
        aws iam delete-role-policy --role-name $role --policy-name $policy_name || true
    done
    # Delete the role
    aws iam delete-role --role-name $role || true
    echo "Deleted role: $role"
done

# Create new OIDC provider
echo "Creating new OIDC provider..."
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create roles for each repo and environment
for repo_info in "${REPOS[@]}"; do
    IFS=':' read -r repo_name repo_desc repo_short <<< "$repo_info"
    echo "Setting up roles for ${repo_desc} (${repo_name})..."
    
    for env in "${ENVIRONMENTS[@]}"; do
        echo "Creating role for ${repo_name} in ${env} environment..."
        
        # Create trust policy
        trust_policy_file=$(create_trust_policy $repo_name $env)
        
        # Create role with shorter name
        role_name="github-actions-${repo_short}-${env}"
        echo "Creating role: $role_name"
        aws iam create-role \
            --role-name $role_name \
            --assume-role-policy-document file://$trust_policy_file
        
        # Create and attach role policy
        role_policy_file=$(create_role_policy $repo_name $env)
        echo "Attaching policy to role: $role_name"
        aws iam put-role-policy \
            --role-name $role_name \
            --policy-name github-actions-policy \
            --policy-document "file://$role_policy_file"
        
        # Verify the role and its policies
        echo "Verifying role: $role_name"
        aws iam get-role --role-name $role_name
        echo "Verifying role policy:"
        aws iam get-role-policy --role-name $role_name --policy-name github-actions-policy
        
        echo "Created role: $role_name"
        echo "Use this role ARN in your GitHub Actions workflow:"
        echo "arn:aws:iam::$ACCOUNT_ID:role/$role_name"
        echo "---"
    done
done

# Clean up temporary files
rm -f trust-policy-*.json role-policy-*.json

echo "Setup complete! Here's a summary of the roles created:"
for repo_info in "${REPOS[@]}"; do
    IFS=':' read -r repo_name repo_desc repo_short <<< "$repo_info"
    echo "${repo_desc} (${repo_name}):"
    for env in "${ENVIRONMENTS[@]}"; do
        echo "  - ${env}: arn:aws:iam::$ACCOUNT_ID:role/github-actions-${repo_short}-${env}"
    done
done 