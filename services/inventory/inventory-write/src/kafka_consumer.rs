use std::env;
use std::time::Duration;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::message::Message;
use rdkafka::ClientConfig;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::events::ProductCreatedEvent; // Import ProductCreatedEvent

// --- Event Structs (Matching Java DTOs for JSON structure) ---
#[derive(Debug, Deserialize)]
struct CheckoutInitiatedEvent {
    order_id: String, // Changed to String from Uuid
    user_id: String,   // Changed to String from Uuid
    items: Vec<InventoryItem>,
    // total_amount: f64, // If needed from event
    r#type: String, // Event type string, e.g., "CheckoutInitiatedEvent"
}

// Renamed for clarity and consistency with shared DTO
#[derive(Debug, Deserialize, Serialize)]
struct InventoryItem {
    product_id: String,
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


async fn process_message(
    msg_payload: &[u8],
    producer: &FutureProducer,
    pool: &PgPool,
    product_events_topic: &str, // Pass product_events_topic
    checkout_events_topic: &str, // Pass checkout_events_topic
) {
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
                            order_id: order_id_clone,
                            user_id: user_id_clone,
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
                        order_id: order_id_clone,
                        user_id: user_id_clone,
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
                    order_id: order_id_clone,
                    user_id: user_id_clone,
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
                    order_id: order_id_clone,
                    user_id: user_id_clone,
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
                process_message(payload, &producer, &pool, product_events_topic, checkout_events_topic).await;
            }
            Err(e) => {
                eprintln!("Kafka error: {}", e);
            }
        }
    }
}#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use rdkafka::producer::{ProducerContext, ThreadedProducer};
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePool}; // Use Sqlite for in-memory testing

    // Mock ProducerContext for rdkafka
    struct MockProducerContext;
    impl ProducerContext for MockProducerContext {}

    // A mock producer that does nothing
    struct MockProducer {
        inner: ThreadedProducer<MockProducerContext>,
    }

    impl MockProducer {
        fn new() -> Self {
            let producer_config = ClientConfig::new()
                .set("bootstrap.servers", "localhost:9092")
                .create_with_context(MockProducerContext)
                .expect("Failed to create mock producer");
            MockProducer { inner: producer_config }
        }
    }

    impl rdkafka::producer::Producer<MockProducerContext> for MockProducer {
        fn client(&self) -> &rdkafka::Client {
            self.inner.client()
        }

        fn send(
            &self,
            record: &rdkafka::producer::BaseRecord<'_, [u8], [u8]>,
        ) -> Result<(), rdkafka::error::KafkaError> {
            // Simply log that a message was "sent"
            println!(
                "MockProducer: Sent message to topic {} with key {:?}",
                record.topic,
                record.key
            );
            Ok(())
        }
    }


    #[tokio::test]
    async fn test_process_checkout_initiated_event_success() {
        // Setup: Create an in-memory SQLite database for testing PgPool
        let pool = SqlitePool::connect_options(
            SqliteConnectOptions::new()
                .filename(":memory:")
                .create_if_missing(true),
        )
        .await
        .expect("Failed to connect to in-memory SQLite");
        sqlx::migrate!().run(&pool).await.expect("Failed to run migrations"); // Run migrations to create 'inventory' table

        // Insert some initial inventory
        sqlx::query("INSERT INTO inventory_items (product_id, quantity) VALUES ($1, $2)")
            .bind("prod-1".to_string())
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
                    product_id: "prod-1".to_string(),
                    quantity: 5,
                },
            ],
            total_amount: 50.0, // This field is not used in process_message but is part of DTO
            timestamp: chrono::Utc::now().to_rfc3339(),
            r#type: "CheckoutInitiatedEvent".to_string(),
        };
        let payload = serde_json::to_string(&event).unwrap();

        let mock_producer = MockProducer::new();

        // Act
        process_message(payload.as_bytes(), &mock_producer.inner, &pool).await;

        // Assert (check if inventory was updated)
        let (quantity,): (i32,) = sqlx::query_as("SELECT quantity FROM inventory_items WHERE product_id = 'prod-1'")
            .fetch_one(&pool)
            .await
            .expect("Failed to fetch updated quantity");
        assert_eq!(quantity, 5); // 10 - 5 = 5
    }

    #[tokio::test]
    async fn test_process_checkout_initiated_event_failure_insufficient_inventory() {
        // Setup: Create an in-memory SQLite database for testing PgPool
        let pool = SqlitePool::connect_options(
            SqliteConnectOptions::new()
                .filename(":memory:")
                .create_if_missing(true),
        )
        .await
        .expect("Failed to connect to in-memory SQLite");
        sqlx::migrate!().run(&pool).await.expect("Failed to run migrations"); // Run migrations to create 'inventory' table

        // Insert some initial inventory
        sqlx::query("INSERT INTO inventory_items (product_id, quantity) VALUES ($1, $2)")
            .bind("prod-2".to_string())
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
                    product_id: "prod-2".to_string(),
                    quantity: 5, // Requesting 5, only 2 available
                },
            ],
            total_amount: 50.0,
            timestamp: chrono::Utc::now().to_rfc3339(),
            r#type: "CheckoutInitiatedEvent".to_string(),
        };
        let payload = serde_json::to_string(&event).unwrap();

        let mock_producer = MockProducer::new();

        // Act
        process_message(payload.as_bytes(), &mock_producer.inner, &pool).await;

        // Assert (check if inventory was NOT updated)
        let (quantity,): (i32,) = sqlx::query_as("SELECT quantity FROM inventory_items WHERE product_id = 'prod-2'")
            .fetch_one(&pool)
            .await
            .expect("Failed to fetch updated quantity");
        assert_eq!(quantity, 2); // Should remain 2
    }
}

