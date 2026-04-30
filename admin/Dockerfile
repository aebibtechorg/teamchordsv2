# 1. Dependencies stage
FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2. Build stage
FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Production runner
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the Nitro output from build stage
COPY --from=build /app/.output ./.output

EXPOSE 3000

# TanStack Start / Nitro entry point
CMD ["node", ".output/server/index.mjs"]
