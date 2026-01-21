// services/inventory/inventory-read/src/domain/service.rs
// Core business logic.

use sqlx::{PgPool, Error};

use crate::domain::model::Inventory;

#[derive(Debug, Clone)] // Added Debug trait
pub struct InventoryService {
    pool: PgPool,
}

impl InventoryService {
    pub fn new(pool: PgPool) -> Self {
        InventoryService { pool }
    }

    pub async fn get_inventory_by_product_id(&self, product_id: &str) -> Result<Option<Inventory>, Error> {
        let inventory = sqlx::query_as!(
            Inventory,
            r#"
            SELECT product_id, quantity_available
            FROM inventory
            WHERE product_id = $1
            "#,
            product_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(inventory)
    }

    // Add other business logic here as needed
}