FROM rust:1.78-slim-bookworm as builder

WORKDIR /app

# Copy manifest files
COPY services/inventory/inventory-write/Cargo.toml ./Cargo.toml
COPY services/inventory/inventory-write/Cargo.lock ./Cargo.lock

# Copy shared proto definitions
COPY shared/proto/inventory.proto ./shared/proto/inventory.proto

# Copy actual source code
COPY services/inventory/inventory-write/src ./src

# Build the application
RUN cargo build --release

FROM debian:bookworm-slim

# Copy the compiled binary from the builder stage
COPY --from=builder /app/target/release/inventory-write /usr/local/bin/inventory-read

# Set the command to run the application
CMD ["/usr/local/bin/inventory-read"]