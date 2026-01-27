# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy the entire monorepo context
# This is crucial for pnpm to correctly resolve workspace dependencies.
COPY . .

ENV CI=true

# Install pnpm globally and set up PATH
RUN npm install -g pnpm
ENV PNPM_HOME="/usr/local/bin"
ENV PATH="$PNPM_HOME:$PATH"

# Fetch all dependencies to populate the pnpm store for the filtered project
RUN pnpm fetch --filter=cart-crud

# Build the specific service (cart-crud)
ENV CI=true
RUN pnpm install --filter=cart-crud --no-dev
RUN pnpm --filter=cart-crud run build


# Stage 2: Create the final production container
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy the built application output
COPY --from=builder /app/services/cart/cart-crud/dist ./dist

# Copy necessary files for pnpm install in runner
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/services/cart/cart-crud/package.json ./package.json

# Install pnpm globally in runner stage and set up PATH
RUN npm install -g pnpm
ENV PNPM_HOME="/usr/local/bin"
ENV PATH="$PNPM_HOME:$PATH"

# Install production dependencies for cart-crud using the copied lockfile and package.json
RUN pnpm install --prod --no-frozen-lockfile

CMD ["node", "dist/index.js"]