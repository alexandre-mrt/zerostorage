FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
COPY packages/api/package.json ./packages/api/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/dashboard/package.json ./packages/dashboard/
RUN bun install --frozen-lockfile || bun install

# Build
COPY . .
RUN bun run build

# Production
FROM oven/bun:1-slim
WORKDIR /app

COPY --from=base /app/packages/api/dist ./dist
COPY --from=base /app/packages/api/package.json ./
COPY --from=base /app/node_modules ./node_modules

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "dist/index.js"]
