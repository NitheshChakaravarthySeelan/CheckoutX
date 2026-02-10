// services/inventory/inventory-read/src/domain/service.rs
// Core business logic.

use sqlx::{PgPool, Error};
use uuid::Uuid; // Added Uuid import

use crate::domain::model::Inventory;

#[derive(Debug, Clone)] // Added Debug trait
pub struct InventoryService {
    pool: PgPool,
}

impl InventoryService {
    pub fn new(pool: PgPool) -> Self {
        InventoryService { pool }
    }

    pub async fn get_inventory_by_product_id(&self, product_id: Uuid) -> Result<Option<Inventory>, Error> {
        let inventory = sqlx::query_as!(
            Inventory,
            r#"
            SELECT id, product_id as "product_id!: Uuid", quantity, created_at, updated_at
            FROM inventory_items
            WHERE product_id = $1::UUID
            "#,
            product_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(inventory)
    }

    // Add other business logic here as needed
}