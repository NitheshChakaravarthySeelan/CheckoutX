// services/inventory/inventory-write/src/domain/service.rs
// Core business logic.

use sqlx::{PgPool, Error};
use uuid::Uuid;
use crate::domain::model::{InventoryItem, UpdateStockRequest};
use time;

#[derive(Clone)]
pub struct InventoryService {
    pool: PgPool,
}

impl InventoryService {
    pub fn new(pool: PgPool) -> Self {
        InventoryService { pool }
    }

    pub async fn update_inventory(&self, product_id: &str, request: UpdateStockRequest) -> Result<InventoryItem, Error> {
        // Here we would typically find the existing inventory item for product_id
        // and update its quantity. If it doesn't exist, we might create it.
        // For simplicity, let's assume we always update an existing one or create if not found.

        let current_time = time::OffsetDateTime::now_utc();

        let inventory = sqlx::query_as!(
            InventoryItem,
            r#"
            INSERT INTO inventory_items (product_id, quantity, created_at, updated_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (product_id) DO UPDATE
            SET quantity = inventory_items.quantity + $2, updated_at = $4
            RETURNING id, product_id, quantity, created_at, updated_at
            "#,
            product_id,
            request.quantity,
            current_time,
            current_time
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(inventory)
    }

    // Add other business logic here as needed
}