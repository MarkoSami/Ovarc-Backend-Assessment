# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including sequelize-cli for migrations)
RUN npm ci

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy migrations and config for sequelize-cli
COPY migrations ./migrations
COPY config ./config

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Run entrypoint script (migrations + start)
ENTRYPOINT ["./docker-entrypoint.sh"]
