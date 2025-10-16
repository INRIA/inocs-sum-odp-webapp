# syntax=docker/dockerfile:1.7

# --- Stage 1: Build Astro app -------------------------------------------------
FROM node:20-bookworm-slim AS builder
ENV NODE_ENV=production

# Install minimal utilities (for Prisma + SSL + debugging)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first (better build cache)
COPY package.json package-lock.json ./

# Install full dependencies (including dev for build)
RUN npm ci

# Copy Prisma schema & generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source files and build the project
COPY . .
RUN npm run build

# --- Stage 2: Production dependencies only ------------------------------------
FROM node:20-bookworm-slim AS prod-deps
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./

# Install only production dependencies (omit dev)
RUN npm ci --omit=dev

# Copy Prisma schema and regenerate client (ensures correct runtime client)
COPY prisma ./prisma
RUN npx prisma generate

# --- Stage 3: Final runtime image ---------------------------------------------
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

WORKDIR /app

# Copy built app & runtime dependencies
COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/prisma ./prisma
COPY package.json ./

# Ensure ownership and drop privileges
RUN chown -R node:node /app
USER node

# Expose Astro Node adapter default port
EXPOSE 4321

# Optional healthcheck for container orchestration
# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "./dist/server/entry.mjs"]