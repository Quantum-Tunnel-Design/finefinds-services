#!/bin/bash

set -e

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
OIDC_ARN="arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"

# 1. Detach all policies and delete all github-actions-* roles
for role in $(aws iam list-roles --query "Roles[?starts_with(RoleName, 'github-actions-')].RoleName" --output text); do
  # Detach managed policies
  for policy_arn in $(aws iam list-attached-role-policies --role-name $role --query "AttachedPolicies[].PolicyArn" --output text); do
    aws iam detach-role-policy --role-name $role --policy-arn $policy_arn
  done
  # Delete inline policies
  for policy_name in $(aws iam list-role-policies --role-name $role --query "PolicyNames" --output text); do
    aws iam delete-role-policy --role-name $role --policy-name $policy_name
  done
  # Delete the role
  aws iam delete-role --role-name $role
  echo "Deleted role: $role"
done

# 2. Delete the OIDC provider
aws iam delete-open-id-connect-provider --open-id-connect-provider-arn $OIDC_ARN || true

echo "Recreating OIDC provider..."
# 3. Recreate the OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

echo "Creating trust policy..."
# 4. Create trust policy for Quantum-Tunnel-Design/finefinds-services:dev
touch trust-policy.json
cat > trust-policy.json <<EOF
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
            "repo:Quantum-Tunnel-Design/finefinds-services:environment:dev",
            "repo:Quantum-Tunnel-Design/finefinds-services:ref:refs/heads/dev"
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

echo "Creating new role..."
# 5. Create the role
aws iam create-role \
  --role-name github-actions-Quantum-Tunnel-Design-finefinds-services-dev \
  --assume-role-policy-document file://trust-policy.json

echo "Attaching ECR/ECS policy..."
# 6. Attach ECR/ECS policy
touch role-policy.json
cat > role-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
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
        "ecr:PutImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name github-actions-Quantum-Tunnel-Design-finefinds-services-dev \
  --policy-name github-actions-policy \
  --policy-document file://role-policy.json

echo "Setup complete. Use role: arn:aws:iam::$ACCOUNT_ID:role/github-actions-Quantum-Tunnel-Design-finefinds-services-dev" 