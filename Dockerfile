# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm build

# Production stage
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle

# Build a production-only entry point that doesn't import vite
RUN npx esbuild dist/server_azure-startup.js 2>/dev/null || true

EXPOSE 8080

# Use azure-startup.ts bundled version
CMD ["node", "dist/azure-startup.js"]
