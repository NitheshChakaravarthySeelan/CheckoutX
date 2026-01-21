# Stage 1: Build the Rust application
FROM rust:1.70 as builder

# Create a new empty shell project
RUN USER=root cargo new --bin /app
WORKDIR /app

# Copy over the manifests
COPY ./services/catalog/product-lookup-rust/Cargo.toml ./Cargo.toml
COPY ./services/catalog/product-lookup-rust/Cargo.lock ./Cargo.lock

# Copy the source code
COPY ./services/catalog/product-lookup-rust/src ./src
COPY ./shared/proto/product_lookup.proto ./shared/proto/product_lookup.proto
COPY ./services/catalog/product-lookup-rust/build.rs ./build.rs

# Build the application
RUN cargo build --release --bin product-lookup-rust

# Stage 2: Create the final lightweight image
FROM debian:buster-slim

# Copy the binary from the builder stage
COPY --from=builder /app/target/release/product-lookup-rust /usr/local/bin/product-lookup-rust

# Set the command to run the application
CMD ["/usr/local/bin/product-lookup-rust"]
