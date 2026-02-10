// services/inventory/inventory-write/src/domain/model.rs

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use time;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct InventoryItem {
    pub id: Uuid,
    pub product_id: Uuid,
    pub quantity: i32,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: time::OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: time::OffsetDateTime,
}

// define structs for API requests here
#[derive(Debug, Deserialize)]
pub struct UpdateStockRequest {
    pub quantity: i32,
}
