# Build stage
FROM --platform=${BUILDPLATFORM:-linux/amd64} node:18-alpine AS builder

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build && \
    echo "Contents of dist directory after build:" && \
    ls -la dist/ && \
    echo "Contents of dist directory (recursive):" && \
    find dist/ -type f

# Production stage
FROM --platform=${TARGETPLATFORM:-linux/amd64} node:18-alpine

# Define build arguments for environment variables
ARG AWS_REGION
ARG COGNITO_USER_POOL_ID
ARG COGNITO_CLIENT_ID
ARG COGNITO_CLIENT_USER_POOL_ID
ARG COGNITO_CLIENT_CLIENT_ID
ARG COGNITO_ADMIN_USER_POOL_ID
ARG COGNITO_ADMIN_CLIENT_ID
ARG JWT_SECRET

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Copy config directory for environment variables
COPY config ./config/

# Copy our entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Generate Prisma Client
RUN npx prisma generate

# Set environment variables
ENV NODE_ENV=production

# Set environment variables from build arguments
ENV AWS_REGION=${AWS_REGION}
ENV COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
ENV COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
ENV COGNITO_CLIENT_USER_POOL_ID=${COGNITO_CLIENT_USER_POOL_ID}
ENV COGNITO_CLIENT_CLIENT_ID=${COGNITO_CLIENT_CLIENT_ID}
ENV COGNITO_ADMIN_USER_POOL_ID=${COGNITO_ADMIN_USER_POOL_ID}
ENV COGNITO_ADMIN_CLIENT_ID=${COGNITO_ADMIN_CLIENT_ID}
ENV JWT_SECRET=${JWT_SECRET}

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application with our entrypoint script
CMD ["/app/docker-entrypoint.sh"] 