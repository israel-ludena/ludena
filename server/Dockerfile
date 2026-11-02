FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma and wget for health check (Alpine uses apk)
RUN apk add --no-cache openssl curl wget gnupg

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# Copy package files and prisma schema
COPY package.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Set DATABASE_URL for Prisma generate
ENV DATABASE_URL="file:/app/prisma/dev.db"

# Install ALL dependencies (including devDependencies for build)
RUN pnpm install --no-frozen-lockfile

# Generate Prisma Client
RUN pnpm prisma generate

# Copy source code
COPY src ./src

# Build the application
RUN pnpm run build

# Copy existing uploads folder with files
COPY uploads ./uploads

# Expose port 4008 for Fastify server and 5555 for Prisma Studio
EXPOSE 4008 5555

# Start the application with migration
CMD ["sh", "-c", "pnpm prisma db push --accept-data-loss && pnpm run start"]
