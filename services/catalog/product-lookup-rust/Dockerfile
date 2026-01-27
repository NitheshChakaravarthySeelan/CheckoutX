# Stage 1: Build the Rust application
FROM rust:1.93.0-bookworm as builder

# Accept DATABASE_URL as a build argument
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV SQLX_OFFLINE=true
# Enable SQLX offline mode

# Install protoc compiler
RUN apt-get update && apt-get install -y protobuf-compiler

WORKDIR /app
# Copy over the manifests
COPY services/catalog/product-lookup-rust/Cargo.toml ./Cargo.toml


# Copy the source code
COPY services/catalog/product-lookup-rust/src ./src
# Copy shared protos
COPY shared/proto /shared/proto
COPY services/catalog/product-lookup-rust/build.rs ./build.rs

# Copy the .sqlx directory for offline mode
COPY services/catalog/product-lookup-rust/.sqlx ./.sqlx


# Build the application
RUN cargo build --release --bin product-lookup-rust

# Stage 2: Create the final lightweight image
FROM debian:bookworm-slim

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/product-lookup-rust /usr/local/bin/product-lookup-rust

# Set the command to run the application
CMD ["/usr/local/bin/product-lookup-rust"]
