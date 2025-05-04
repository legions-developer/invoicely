# Build stage
FROM node:23.11.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy workspace files
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
# Copy packages directory if it exists (Docker will ignore if it doesn't exist)
COPY packages ./packages

# Install dependencies
RUN yarn install

# Copy source code
COPY apps/web ./apps/web

# Build the application
RUN yarn build

# Production stage
FROM node:23.11.0-alpine AS runner

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/next.config.ts

# Install production dependencies only
ENV NODE_ENV=production
RUN yarn workspaces focus --all --production

# Expose the port the app runs on
EXPOSE 3000

# Set the command to start the app
CMD ["yarn", "--cwd", "apps/web", "start"]