// services/inventory/inventory-read/src/domain/model.rs
// Core business structs (domain entities).

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use time; // Import the time crate for serde integration
use sqlx::types::time::OffsetDateTime; // Explicitly import OffsetDateTime from sqlx's types

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Inventory {
    pub id: Uuid,
    pub product_id: String,
    pub quantity: i32,
    #[serde(with = "time::serde::rfc3339")] // Use time's serde integration
    pub created_at: OffsetDateTime, // Use sqlx's OffsetDateTime
    #[serde(with = "time::serde::rfc3339")] // Use time's serde integration
    pub updated_at: OffsetDateTime, // Use sqlx's OffsetDateTime
}