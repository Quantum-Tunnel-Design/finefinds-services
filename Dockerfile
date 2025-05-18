# Build stage
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

WORKDIR /app

# Copy package files
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
FROM --platform=$TARGETPLATFORM node:18-alpine

WORKDIR /app

# Install OpenSSL and PostgreSQL
RUN apk add --no-cache openssl postgresql postgresql-client

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Create PostgreSQL data directory
RUN mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql/data && \
    chmod 700 /var/lib/postgresql/data

# Create initialization script
RUN echo '#!/bin/sh\n\
# Initialize PostgreSQL\n\
initdb -D /var/lib/postgresql/data\n\
\n\
# Start PostgreSQL\n\
pg_ctl -D /var/lib/postgresql/data start\n\
\n\
# Create database and user\n\
psql -U postgres -c "CREATE DATABASE finefinds;"\n\
psql -U postgres -c "CREATE USER postgres WITH PASSWORD '\''OonqwYbElKaCM57fnScMMf9qlsW4FxEmvPjM60aV'\'';"\n\
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE finefinds TO postgres;"\n\
\n\
# Run migrations\n\
npm run prisma:migrate\n\
\n\
# Start the application\n\
node dist/src/main.js\n\
' > /app/start.sh && chmod +x /app/start.sh

# Debug: Verify files are copied correctly
RUN echo "Contents of /app directory:" && \
    ls -la /app && \
    echo "Contents of /app/dist directory:" && \
    ls -la /app/dist && \
    echo "Contents of /app/dist directory (recursive):" && \
    find /app/dist -type f

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:OonqwYbElKaCM57fnScMMf9qlsW4FxEmvPjM60aV@localhost:5432/finefinds?schema=public"

# Expose ports
EXPOSE 3000 5432

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["/app/start.sh"] 