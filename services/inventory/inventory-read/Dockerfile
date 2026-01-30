# ---------- Stage 1: Build ----------
FROM rust:1.93.0-bookworm AS builder

# Enforce SQLx offline mode
ENV SQLX_OFFLINE=true

# Install system dependencies
RUN apt-get update && apt-get install -y protobuf-compiler && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pnpm-workspace.yaml /pnpm-workspace.yaml

# --- Copy manifests first (better caching) ---
COPY services/inventory/inventory-read/Cargo.toml ./Cargo.toml

# If you have a workspace Cargo.toml at repo root, copy it too:
# COPY Cargo.toml ./Cargo.toml

# --- Copy SQLx offline cache ---
COPY services/inventory/inventory-read/.sqlx ./.sqlx

# --- Copy build script and sources ---
COPY services/inventory/inventory-read/build.rs ./build.rs
COPY services/inventory/inventory-read/src ./src

# --- Copy shared proto definitions ---
COPY shared/proto /shared/proto

# --- Build ---
RUN cargo build --release --bin inventory-read


# ---------- Stage 2: Runtime ----------
FROM debian:bookworm-slim

# Optional but recommended: SSL certs if you talk to HTTPS / Postgres TLS
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the compiled binary
COPY --from=builder /app/target/release/inventory-read /usr/local/bin/inventory-read

# Run it
CMD ["/usr/local/bin/inventory-read"]

