use serde::Deserialize;
use std::fmt::{self, Display};
use std::error::Error;
use uuid::Uuid; // Added Uuid import

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")] // Match Java's camelCase if used
pub struct ProductCreatedEvent {
    pub product_id: Uuid, // Changed to Uuid
    pub sku: String,
    pub name: String,
    pub price: f64, // Price in double, as in Java ProductCreatedEvent
    pub initial_quantity: i32, // Quantity
}

impl Display for ProductCreatedEvent {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "ProductCreatedEvent(productId={}, sku={}, name={}, price={}, initialQuantity={})",
            self.product_id, self.sku, self.name, self.price, self.initial_quantity
        )
    }
}

// Define custom error for event parsing if needed
#[derive(Debug)]
pub enum EventError {
    Json(serde_json::Error),
    // Add other event-related errors here if necessary
}

impl Display for EventError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EventError::Json(e) => write!(f, "JSON deserialization error: {}", e),
        }
    }
}

impl Error for EventError {}
