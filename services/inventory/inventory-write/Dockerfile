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
COPY services/inventory/inventory-write/Cargo.toml ./services/inventory/inventory-write/Cargo.toml
COPY services/inventory/inventory-write/Cargo.lock ./services/inventory/inventory-write/Cargo.lock

# --- Copy build script and sources ---
# build.rs is not present in inventory-write, so we don't copy it.
COPY services/inventory/inventory-write/src ./services/inventory/inventory-write/src

# --- Copy shared proto definitions ---
COPY shared/proto /shared/proto

# --- Copy migrations ---
COPY services/inventory/inventory-write/migrations ./services/inventory/inventory-write/migrations

# Change to the service's directory
WORKDIR /app/services/inventory/inventory-write

# Copy generated SQLx metadata for offline mode
COPY services/inventory/inventory-write/.sqlx ./.sqlx



# --- Build ---
RUN cargo build --release --bin inventory-write


# ---------- Stage 2: Runtime ----------
FROM debian:bookworm-slim

# Copy the compiled binary
COPY --from=builder /app/services/inventory/inventory-write/target/release/inventory-write /usr/local/bin/inventory-write

# Run it
CMD ["/usr/local/bin/inventory-write"]
