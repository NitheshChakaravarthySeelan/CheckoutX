# ---------- Stage 1: Build ----------
FROM rust:latest AS builder

# Accept DATABASE_URL as a build argument
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
# We will run sqlx prepare online during the build
ENV SQLX_OFFLINE=true

# Install system dependencies
RUN apt-get update && apt-get install -y protobuf-compiler libsasl2-dev pkg-config && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy pnpm-workspace.yaml to the root for workspace detection by build.rs
COPY pnpm-workspace.yaml /pnpm-workspace.yaml

# --- Copy manifests first (better caching) ---
COPY services/catalog/product-lookup-rust/Cargo.toml ./Cargo.toml
COPY services/catalog/product-lookup-rust/Cargo.lock ./Cargo.lock

# --- Copy build script and sources ---
COPY services/catalog/product-lookup-rust/build.rs ./build.rs
COPY services/catalog/product-lookup-rust/src ./src

# --- Copy shared proto definitions ---
COPY shared/proto /shared/proto

# Copy generated SQLx metadata for offline mode
COPY services/catalog/product-lookup-rust/.sqlx ./.sqlx



# --- Build ---
RUN cargo build --release --bin product-lookup-rust


# ---------- Stage 2: Runtime ----------
FROM debian:bookworm-slim

# Optional but recommended: SSL certs if you talk to HTTPS / Postgres TLS
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the compiled binary
COPY --from=builder /app/target/release/product-lookup-rust /usr/local/bin/product-lookup-rust

# Run it
CMD ["/usr/local/bin/product-lookup-rust"]
