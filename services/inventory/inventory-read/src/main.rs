// services/inventory/inventory-read/src/main.rs
// Main binary entrypoint.

use actix_web::{web, App, HttpServer};
use dotenvy::dotenv;
use sqlx::PgPool;
use std::env;
use std::net::SocketAddr;

use inventory_read::api::{health, inventory as http_inventory};
use inventory_read::domain::service::InventoryService;
use inventory_read::telemetry::{init_subscriber, setup_metrics_recorder};

// New imports for gRPC server
use tonic::transport::Server;
use crate::grpc_server::InventoryGrpcService;
use inventory_read::inventory_proto::inventory_service_server::InventoryServiceServer;
mod grpc_server; // Make grpc_server module visible

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    init_subscriber("inventory-read".into(), "info".into()); // Initialize tracing subscriber
    let recorder_handle = setup_metrics_recorder(); // Setup Prometheus metrics recorder

    println!("Starting inventory-read service...");

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to Postgres.");

    // Create the table if it doesn't exist
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS inventory_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID UNIQUE NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity >= 0),
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        );
        "#
    )
    .execute(&pool)
    .await
    .expect("Failed to create inventory_items table.");

    let inventory_service = InventoryService::new(pool.clone());
    let inventory_service_grpc = inventory_service.clone(); // Clone for gRPC server

    // --- Actix-web HTTP Server Setup ---
    let http_server_handle = HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(recorder_handle.clone())) // Pass PrometheusHandle to be accessible by handlers
            .app_data(web::Data::new(pool.clone())) // Pass pool to be accessible by handlers
            .app_data(web::Data::new(inventory_service.clone())) // Pass InventoryService
            .service(health::health_check) // Register health check route
            .route("/metrics", web::get().to(health::prometheus_metrics_handler)) // Add metrics route
            .route("/inventory/{product_id}", web::get().to(http_inventory::get_inventory_by_product_id)) // Register inventory route
    })
    .bind(("0.0.0.0", 8080))? // Use port 8080 by default
    .run(); // .await moved to tokio::select!

    // --- gRPC Server Setup ---
    let grpc_addr_str = env::var("GRPC_SERVER_ADDRESS").unwrap_or_else(|_| "0.0.0.0:50051".to_string());
    let grpc_addr: SocketAddr = grpc_addr_str.parse().expect("Invalid GRPC_SERVER_ADDRESS");

    let grpc_inventory_service_impl = InventoryGrpcService::new(inventory_service_grpc);
    let grpc_server_handle = Server::builder()
        .add_service(InventoryServiceServer::new(grpc_inventory_service_impl))
        .serve(grpc_addr);

    println!("gRPC server listening on {}", grpc_addr);

    // Run both servers concurrently
    tokio::select! {
        _ = http_server_handle => {
            println!("Actix-web server finished.");
        }
        _ = grpc_server_handle => {
            println!("gRPC server finished.");
        }
    }

    Ok(())
}
