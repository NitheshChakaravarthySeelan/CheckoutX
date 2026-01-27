FROM rust:latest as builder

# Accept DATABASE_URL as a build argument
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
# Enable SQLX offline mode
ENV SQLX_OFFLINE=true

# Install protoc compiler
RUN apt-get update && apt-get install -y protobuf-compiler

# Copy pnpm-workspace.yaml to the root for workspace detection by build.rs
COPY pnpm-workspace.yaml /pnpm-workspace.yaml

WORKDIR /app

# Copy the .sqlx directory for offline mode
COPY services/inventory/inventory-read/.sqlx ./.sqlx

# Copy manifest files
COPY ../../services/inventory/inventory-read/Cargo.toml ./Cargo.toml
COPY ../../services/inventory/inventory-read/Cargo.lock ./Cargo.lock

# Copy build.rs (for proto generation)
COPY ../../services/inventory/inventory-read/build.rs ./build.rs

# Copy shared proto definitions
COPY ../../shared/proto /shared/proto

# Copy actual source code
COPY ../../services/inventory/inventory-read/src ./src

# Build the application
RUN cargo build --release

FROM debian:bookworm-slim

# Copy the compiled binary from the builder stage
COPY --from=builder /app/target/release/inventory-read /usr/local/bin/inventory-read

# Set the command to run the application
CMD ["/usr/local/bin/inventory-read"]