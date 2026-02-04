// services/inventory/inventory-write/src/main.rs
// Main binary entrypoint.

use actix_web::{web, App, HttpServer, HttpResponse};
use dotenvy::dotenv;
use sqlx::PgPool;
use std::env;
use prometheus::{self, Encoder};

use inventory_write::api::{health, inventory};
use inventory_write::domain::service::InventoryService;
use inventory_write::telemetry::{init_subscriber, setup_metrics_recorder, TracingLogger};
use inventory_write::events::ProductCreatedEvent; // Import ProductCreatedEvent

use inventory_write::kafka_consumer;



async fn metrics_endpoint(prometheus_registry: web::Data<prometheus::Registry>) -> HttpResponse {
    let mut buffer = vec![];
    let encoder = prometheus::TextEncoder::new();
    let metric_families = prometheus_registry.gather();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    HttpResponse::Ok().body(buffer)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    init_subscriber("inventory-write".into(), "info".into()); // Initialize tracing subscriber
    let prometheus_registry = setup_metrics_recorder(); // Setup Prometheus metrics recorder

    println!("Starting inventory-write service...");

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to Postgres.");

    // Run database migrations
    sqlx::migrate!().run(&pool).await
        .expect("Failed to run database migrations");



    let inventory_service = InventoryService::new(pool.clone());

    // --- Kafka Consumer Setup ---
    let product_events_topic = env::var("PRODUCT_EVENTS_TOPIC")
        .unwrap_or_else(|_| "product-events".to_string());
    let checkout_events_topic = env::var("CHECKOUT_EVENTS_TOPIC")
        .unwrap_or_else(|_| "checkout.checkout-events".to_string());
    let kafka_group_id = env::var("KAFKA_GROUP_ID")
        .unwrap_or_else(|_| "inventory-write-group".to_string());

    let pool_clone = pool.clone();
    tokio::spawn(async move {
        kafka_consumer::run_kafka_consumer(
            pool_clone,
            &product_events_topic,
            &checkout_events_topic,
            &kafka_group_id
        ).await;
    });

    HttpServer::new(move || {
        App::new()
            .wrap(TracingLogger::default()) // Add tracing for requests
            .app_data(web::Data::new(pool.clone())) // Pass pool to be accessible by handlers
            .app_data(web::Data::new(inventory_service.clone())) // Pass InventoryService
            .app_data(web::Data::new(prometheus_registry.clone()))
            .service(health::health_check) // Register health check route
            .route("/inventory/{product_id}/update", web::post().to(inventory::update_inventory)) // Register inventory update route
            .route("/metrics", web::get().to(metrics_endpoint)) // Add metrics endpoint
    })
    .bind(("0.0.0.0", 8080))? // Use port 8080 by default
    .run()
    .await?;

    Ok(())
}
