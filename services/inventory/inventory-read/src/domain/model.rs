// services/inventory/inventory-read/src/domain/model.rs
// Core business structs (domain entities).

use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Inventory {
    pub product_id: Uuid,
    pub quantity_available: i32,
}