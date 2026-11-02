# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Copy package files
COPY package.json ./
COPY tsconfig*.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./
COPY components.json ./

# Install dependencies (generate lockfile in CI)
RUN pnpm install --no-frozen-lockfile

# Copy environment file
COPY .env ./

# Copy source code and assets
COPY public ./public
COPY src ./src
COPY messages ./messages

# Build the Next.js application (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=true
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port 4007 for Next.js server
EXPOSE 4007

# Start Next.js server
CMD ["node", "server.js"]
