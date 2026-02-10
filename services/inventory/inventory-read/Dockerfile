# ---------- Stage 1: Build ----------
FROM rust:latest AS builder

# Accept DATABASE_URL as a build argument
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
# We will run sqlx prepare online during the build
ENV SQLX_OFFLINE=true

# Install system dependencies
RUN apt-get update && apt-get install -y protobuf-compiler libsasl2-dev pkg-config ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy pnpm-workspace.yaml to the root for workspace detection by build.rs
COPY pnpm-workspace.yaml /pnpm-workspace.yaml

# --- Copy manifests first (better caching) ---
COPY services/inventory/inventory-read/Cargo.toml ./services/inventory/inventory-read/Cargo.toml
COPY services/inventory/inventory-read/Cargo.lock ./services/inventory/inventory-read/Cargo.lock

# --- Copy build script and sources ---
COPY services/inventory/inventory-read/build.rs ./services/inventory/inventory-read/build.rs
COPY services/inventory/inventory-read/src ./services/inventory/inventory-read/src

# --- Copy shared proto definitions ---
COPY shared/proto /app/shared/proto

# Change to the service's directory
WORKDIR /app/services/inventory/inventory-read

# Copy generated SQLx metadata for offline mode
COPY services/inventory/inventory-read/.sqlx ./.sqlx



# --- Build ---
RUN cargo build --release --bin inventory-read


# ---------- Stage 2: Runtime ----------
FROM debian:bookworm-slim

# Copy the compiled binary
COPY --from=builder /app/services/inventory/inventory-read/target/release/inventory-read /usr/local/bin/inventory-read

# Run it
CMD ["/usr/local/bin/inventory-read"]
