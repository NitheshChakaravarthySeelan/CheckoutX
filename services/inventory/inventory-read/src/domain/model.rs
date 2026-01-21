// services/inventory/inventory-read/src/domain/model.rs
// Core business structs (domain entities).

use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Inventory {
    pub product_id: String,
    pub quantity_available: i32,
}