# 1. Base image
FROM node:20-alpine AS base

WORKDIR /app

# 2. Install dependencies (Yarn, Turbo, etc.)
COPY package.json yarn.lock ./
COPY .yarn .yarn
COPY .yarnrc.yml ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies (using zero-install if enabled)
RUN yarn install --immutable

# 3. Copy the rest of the monorepo
COPY . .

# 4. Build the Next.js app using Turbo
RUN yarn turbo run build --filter=web...

# 5. Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy root workspace files
COPY --from=base /app/package.json ./
COPY --from=base /app/yarn.lock ./
COPY --from=base /app/.yarn ./.yarn
COPY --from=base /app/.yarnrc.yml ./.yarnrc.yml

# Copy all packages and apps (for workspace dependencies)
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps ./apps

COPY --from=base /app/env-links.sh ./env-links.sh
RUN apk add --no-cache bash
RUN chmod +x ./env-links.sh

# Install only production dependencies (including workspace deps)
RUN yarn workspaces focus web --production

RUN yarn run sys-link

# Copy the built Next.js app
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/next.config.ts ./apps/web/next.config.ts

# Expose Next.js port
EXPOSE 3000

# Start the Next.js app
CMD ["yarn", "workspace", "web", "start"]
