# Dockerfile for Cashback Detective
# Multi-stage build for production-ready image

FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build frontend
FROM base AS frontend-builder
COPY --from=deps /app/node_modules ./node_modules
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm ci && npm run build

# Build backend
FROM base AS backend-builder
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY tsconfig.json ./
COPY package*.json ./
RUN npm run build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "dist/server.js"]