# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy the entire monorepo context
COPY . .

# Install pnpm and dependencies, then build the specific service
RUN npm install -g pnpm
ENV CI=true
RUN pnpm install --filter=gateway-bff --ignore-scripts
RUN pnpm --filter=gateway-bff run build

# Stage 2: Create the final, lightweight production container
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy the entire standalone output to the root of the app
COPY --from=builder /app/apps/gateway-bff/.next/standalone ./
COPY --from=builder /app/apps/gateway-bff/public ./public

EXPOSE 3000
ENV PORT 3000

# Start the Next.js server
# server.js is now expected to be directly in /app
CMD ["node", "server.js"]
