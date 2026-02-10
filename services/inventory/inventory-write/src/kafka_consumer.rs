use std::env;
use std::time::Duration;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::message::Message;
use rdkafka::ClientConfig;
use serde::{Deserialize, Serialize};
use sqlx::PgPool; // Keep PgPool for run_kafka_consumer
use uuid::Uuid; // Added Uuid import

use crate::events::ProductCreatedEvent; // Import ProductCreatedEvent

// --- Event Structs (Matching Java DTOs for JSON structure) ---
#[derive(Debug, Deserialize, Serialize)]
struct CheckoutInitiatedEvent {
    order_id: Uuid, // Changed to Uuid
    user_id: Uuid,   // Changed to Uuid
    items: Vec<InventoryItem>,
    // total_amount: f64, // If needed from event
    r#type: String, // Event type string, e.g., "CheckoutInitiatedEvent"
}

// Renamed for clarity and consistency with shared DTO
#[derive(Debug, Deserialize, Serialize)]
struct InventoryItem {
    product_id: Uuid,
    quantity: i32,
}

#[derive(Debug, Serialize)]
struct InventoryReservedEvent {
    order_id: String,
    user_id: String,
    timestamp: String, // Instant from Java
    r#type: String, // Event type string
}

#[derive(Debug, Serialize)]
struct InventoryReservationFailedEvent {
    order_id: String,
    user_id: String,
    reason: String,
    timestamp: String, // Instant from Java
    r#type: String, // Event type string
}
// --- End Event Structs ---


async fn process_message<DB>(
    msg_payload: &[u8],
    producer: &FutureProducer,
    pool: &sqlx::Pool<DB>,
    _product_events_topic: &str,
    checkout_events_topic: &str,
) where
    DB: sqlx::Database + Send + Sync,
    <DB as sqlx::Database>::Connection: sqlx::Connection + Send + Unpin, // Connection itself needs Send + Unpin for transaction
    <DB as sqlx::Database>::TransactionManager: sqlx::TransactionManager<Database = DB>,

    // Explicitly declare that Pool and &mut Connection are Executors
    for<'c> &'c sqlx::Pool<DB>: sqlx::Executor<'c, Database = DB>,
    for<'c> &'c mut <DB as sqlx::Database>::Connection: sqlx::Executor<'c, Database = DB>,

    // Bounds for types used in query parameters (.bind())
    for<'a> i32: sqlx::Type<DB> + sqlx::Encode<'a, DB> + sqlx::Decode<'a, DB>,
    for<'a> Uuid: sqlx::Type<DB> + sqlx::Encode<'a, DB> + sqlx::Decode<'a, DB>,
    for<'a> time::OffsetDateTime: sqlx::Type<DB> + sqlx::Encode<'a, DB> + sqlx::Decode<'a, DB>,

    // Corrected IntoArguments bound for all types passed to .bind()
    for<'a> <DB as sqlx::Database>::Arguments<'a>: sqlx::IntoArguments<'a, DB>,

    // Bounds for types returned by queries (FromRow for tuples and structs)
    (i32,): for<'a> sqlx::FromRow<'a, <DB as sqlx::Database>::Row>,
    InventoryItem: for<'a> sqlx::FromRow<'a, <DB as sqlx::Database>::Row>,

    // Ensure the database's Row type correctly implements necessary traits
    <DB as sqlx::Database>::Row: sqlx::Row + sqlx::ColumnIndex<usize> + Unpin,
{
    let raw_event: serde_json::Value = match serde_json::from_slice(msg_payload) {
        Ok(val) => val,
        Err(e) => {
            eprintln!("Failed to deserialize raw message: {}", e);
            return;
        }
    };

    let event_type = raw_event["type"].as_str().unwrap_or_default();

    match event_type {
        "ProductCreatedEvent" => {
            let event: ProductCreatedEvent = match serde_json::from_value(raw_event.clone()) { // Clone raw_event
                Ok(cmd) => cmd,
                Err(e) => {
                    eprintln!("Failed to deserialize ProductCreatedEvent: {}", e);
                    return;
                }
            };
            
            // Insert or update inventory for new product
            if let Err(e) = sqlx::query(
                r#"
                INSERT INTO inventory_items (product_id, quantity)
                VALUES ($1, $2)
                ON CONFLICT (product_id) DO UPDATE SET
                    quantity = inventory_items.quantity + EXCLUDED.quantity,
                    updated_at = NOW()
                "#
            )
            .bind(event.product_id.clone())
            .bind(event.initial_quantity)
            .execute(pool)
            .await
            {
                eprintln!("Failed to insert/update inventory for ProductCreatedEvent: {}", e);
            } else {
                println!("Processed ProductCreatedEvent for Product ID: {}", event.product_id);
            }
        },
        "CheckoutInitiatedEvent" => {
            let event: CheckoutInitiatedEvent = match serde_json::from_value(raw_event) {
                Ok(cmd) => cmd,
                Err(e) => {
                    eprintln!("Failed to deserialize CheckoutInitiatedEvent: {}", e);
                    return;
                }
            };
            
            // Clone values once for use in events and key
            let order_id_clone = event.order_id.clone();
            let user_id_clone = event.user_id.clone();

            let mut transaction = match pool.begin().await {
                Ok(tx) => tx,
                Err(e) => {
                    eprintln!("Failed to begin transaction: {}", e);
                    return;
                }
            };

            let mut sufficient_inventory = true;
            for item in &event.items {
                let row: (i32,) = match sqlx::query_as("SELECT quantity FROM inventory_items WHERE product_id = $1") // Corrected table and column name
                    .bind(item.product_id.clone())
                    .fetch_one(&mut *transaction)
                    .await
                {
                    Ok(row) => row,
                    Err(_) => { // If product not found or other DB error
                        sufficient_inventory = false;
                        break;
                    }
                };

                if row.0 < item.quantity {
                    sufficient_inventory = false;
                    break;
                }
            }

            if sufficient_inventory {
                for item in &event.items {
                    if let Err(e) = sqlx::query("UPDATE inventory_items SET quantity = quantity - $1 WHERE product_id = $2") // Corrected table name
                        .bind(item.quantity)
                        .bind(item.product_id.clone())
                        .execute(&mut *transaction)
                        .await
                    {
                        eprintln!("Failed to update inventory: {}", e);
                        let _ = transaction.rollback().await;
                        
                        // Publish InventoryReservationFailedEvent
                        let failed_event = InventoryReservationFailedEvent {
                            order_id: order_id_clone.to_string(),
                            user_id: user_id_clone.to_string(),
                            reason: format!("Failed to update inventory for product {}: {}", item.product_id, e),
                            timestamp: chrono::Utc::now().to_rfc3339(),
                            r#type: "InventoryReservationFailedEvent".to_string(),
                        };
                        let payload = serde_json::to_string(&failed_event).unwrap();
                        let order_id_str = failed_event.order_id;
                        let record = FutureRecord::to(checkout_events_topic) // Use passed topic name
                            .payload(&payload)
                            .key(&order_id_str); // Use order_id as key

                        if let Err(e) = producer.send(record, Duration::from_secs(0)).await {
                            eprintln!("Failed to send failure message: {:?}", e);
                        }
                        return;
                    }
                }

                if let Err(e) = transaction.commit().await {
                    eprintln!("Failed to commit transaction: {}", e);
                    // Publish InventoryReservationFailedEvent
                    let failed_event = InventoryReservationFailedEvent {
                        order_id: order_id_clone.to_string(),
                        user_id: user_id_clone.to_string(),
                        reason: format!("Failed to commit transaction: {}", e),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                        r#type: "InventoryReservationFailedEvent".to_string(),
                    };
                    let payload = serde_json::to_string(&failed_event).unwrap();
                    let order_id_str = failed_event.order_id;
                    let record = FutureRecord::to(checkout_events_topic) // Use passed topic name
                        .payload(&payload)
                        .key(&order_id_str); // Use order_id as key

                    if let Err(e) = producer.send(record, Duration::from_secs(0)).await {
                        eprintln!("Failed to send failure message: {:?}", e);
                    }
                    return;
                }

                let event = InventoryReservedEvent {
                    order_id: order_id_clone.to_string(),
                    user_id: user_id_clone.to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    r#type: "InventoryReservedEvent".to_string(),
                };
                let payload = serde_json::to_string(&event).unwrap();
                let order_id_str = event.order_id;
                let record = FutureRecord::to(checkout_events_topic) // Use passed topic name
                    .payload(&payload)
                    .key(&order_id_str); // Use order_id as key

                if let Err(e) = producer.send(record, Duration::from_secs(0)).await {
                    eprintln!("Failed to send success message: {:?}", e);
                }
            } else {
                let _ = transaction.rollback().await;
                let event = InventoryReservationFailedEvent {
                    order_id: order_id_clone.to_string(),
                    user_id: user_id_clone.to_string(),
                    reason: "Insufficient inventory".to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    r#type: "InventoryReservationFailedEvent".to_string(),
                };
                let payload = serde_json::to_string(&event).unwrap();
                let order_id_str = event.order_id;
                let record = FutureRecord::to(checkout_events_topic) // Use passed topic name
                    .payload(&payload)
                    .key(&order_id_str); // Use order_id as key

                if let Err(e) = producer.send(record, Duration::from_secs(0)).await {
                    eprintln!("Failed to send failure message: {:?}", e);
                }
            }
        },
        _ => {
            eprintln!("Received unhandled event type: {}", event_type);
        }
    }
}


pub async fn run_kafka_consumer(
    pool: PgPool,
    product_events_topic: &str,
    checkout_events_topic: &str,
    kafka_group_id: &str
) {
    // Load .env file
    dotenvy::dotenv().ok();
    let kafka_bootstrap_servers = env::var("KAFKA_BOOTSTRAP_SERVERS")
        .unwrap_or_else(|_| "localhost:9092".to_string());
    
    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", kafka_bootstrap_servers.clone())
        .set("group.id", kafka_group_id.to_string())
        .set("auto.offset.reset", "earliest")
        .create()
        .expect("Consumer creation failed");

    consumer
        .subscribe(&[product_events_topic, checkout_events_topic]) // Subscribe to both topics
        .expect("Can't subscribe to specified topics");

    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", kafka_bootstrap_servers)
        .create()
        .expect("Producer creation failed");

    loop {
        match consumer.recv().await {
            Ok(msg) => {
                let payload = msg.payload().unwrap_or_default();
                process_message::<sqlx::Postgres>(payload, &producer, &pool, product_events_topic, checkout_events_topic).await;
            }
            Err(e) => {
                eprintln!("Kafka error: {}", e);
            }
        }
    }
}#[cfg(test)]
mod tests {
    use super::*;
    use rdkafka::ClientConfig; // Import ClientConfig
    use rdkafka::producer::FutureProducer; // Import FutureProducer
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePool}; // Use Sqlite for in-memory testing

    #[tokio::test]
    async fn test_process_checkout_initiated_event_success() {
        // Setup: Create an in-memory SQLite database for testing PgPool
        let pool = SqlitePool::connect_with( // Changed from connect_options
            SqliteConnectOptions::new()
                .filename(":memory:")
                .create_if_missing(true),
        )
        .await
        .expect("Failed to connect to in-memory SQLite");
        sqlx::migrate!().run(&pool).await.expect("Failed to run migrations"); // Run migrations to create 'inventory' table

        let product_uuid_1 = Uuid::new_v4();

        // Insert some initial inventory
        sqlx::query("INSERT INTO inventory_items (product_id, quantity) VALUES ($1, $2)")
            .bind(product_uuid_1)
            .bind(10)
            .execute(&pool)
            .await
            .expect("Failed to insert initial inventory");
        
        // Mock a CheckoutInitiatedEvent
        let event = CheckoutInitiatedEvent {
            order_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            items: vec![
                InventoryItem {
                    product_id: product_uuid_1,
                    quantity: 5,
                },
            ],
            r#type: "CheckoutInitiatedEvent".to_string(), // Removed timestamp
        };
        let payload = serde_json::to_string(&event).unwrap();

        // Create a dummy FutureProducer
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", "localhost:1") // Unreachable address
            .set("message.send.max.retries", "0") // Fail fast
            .create()
            .expect("Failed to create dummy producer");

        // Act
        process_message::<sqlx::Sqlite>(payload.as_bytes(), &producer, &pool, "product-events-topic", "checkout-events-topic").await; // Pass &producer

        // Assert (check if inventory was updated)
        let (quantity,): (i32,) = sqlx::query_as("SELECT quantity FROM inventory_items WHERE product_id = $1")
            .bind(product_uuid_1)
            .fetch_one(&pool)
            .await
            .expect("Failed to fetch updated quantity");
        assert_eq!(quantity, 5); // 10 - 5 = 5
    }

    #[tokio::test]
    async fn test_process_checkout_initiated_event_failure_insufficient_inventory() {
        // Setup: Create an in-memory SQLite database for testing PgPool
        let pool = SqlitePool::connect_with( // Changed from connect_options
            SqliteConnectOptions::new()
                .filename(":memory:")
                .create_if_missing(true),
        )
        .await
        .expect("Failed to connect to in-memory SQLite");
        sqlx::migrate!().run(&pool).await.expect("Failed to run migrations"); // Run migrations to create 'inventory' table

        let product_uuid_2 = Uuid::new_v4();

        // Insert some initial inventory
        sqlx::query("INSERT INTO inventory_items (product_id, quantity) VALUES ($1, $2)")
            .bind(product_uuid_2)
            .bind(2)
            .execute(&pool)
            .await
            .expect("Failed to insert initial inventory");

        // Mock a CheckoutInitiatedEvent with insufficient quantity
        let event = CheckoutInitiatedEvent {
            order_id: Uuid::new_v4(),
            user_id: Uuid::new_v4(),
            items: vec![
                InventoryItem {
                    product_id: product_uuid_2,
                    quantity: 5, // Requesting 5, only 2 available
                },
            ],
            r#type: "CheckoutInitiatedEvent".to_string(), // Removed timestamp
        };
        let payload = serde_json::to_string(&event).unwrap();

        // Create a dummy FutureProducer
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", "localhost:1") // Unreachable address
            .set("message.send.max.retries", "0") // Fail fast
            .create()
            .expect("Failed to create dummy producer");

        // Act
        process_message::<sqlx::Sqlite>(payload.as_bytes(), &producer, &pool, "product-events-topic", "checkout-events-topic").await; // Pass &producer

        // Assert (check if inventory was NOT updated)
        let (quantity,): (i32,) = sqlx::query_as("SELECT quantity FROM inventory_items WHERE product_id = $1")
            .bind(product_uuid_2)
            .fetch_one(&pool)
            .await
            .expect("Failed to fetch updated quantity");
        assert_eq!(quantity, 2); // Should remain 2
    }
}