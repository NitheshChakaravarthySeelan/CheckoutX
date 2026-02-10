// services/inventory/inventory-read/src/api/inventory.rs
// Handlers for inventory-related routes.

use actix_web::{web, HttpResponse, Responder};
use crate::domain::service::InventoryService;
use serde_json::json;
use uuid::Uuid; // Added Uuid import

pub async fn get_inventory_by_product_id(
    path: web::Path<String>,
    inventory_service: web::Data<InventoryService>,
) -> impl Responder {
    let product_id_str = path.into_inner();
    let product_id = match Uuid::parse_str(&product_id_str) {
        Ok(uuid) => uuid,
        Err(_) => return HttpResponse::BadRequest().json(json!({"message": "Invalid product ID format"})),
    };

    match inventory_service.get_inventory_by_product_id(product_id).await {
        Ok(Some(inventory)) => HttpResponse::Ok().json(inventory),
        Ok(None) => HttpResponse::NotFound().json(json!({"message": "Inventory not found for product"})),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({"message": "Internal Server Error"}))
        }
    }
}