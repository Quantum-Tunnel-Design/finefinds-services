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

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Debug: Verify files are copied correctly
RUN echo "Contents of /app directory:" && \
    ls -la /app && \
    echo "Contents of /app/dist directory:" && \
    ls -la /app/dist && \
    echo "Contents of /app/dist directory (recursive):" && \
    find /app/dist -type f

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/src/main.js"] 