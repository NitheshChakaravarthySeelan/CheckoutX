// services/inventory/inventory-read/src/api/inventory.rs
// Handlers for inventory-related routes.

use actix_web::{web, HttpResponse, Responder};
use crate::domain::service::InventoryService;
use serde_json::json;

pub async fn get_inventory_by_product_id(
    path: web::Path<String>,
    inventory_service: web::Data<InventoryService>,
) -> impl Responder {
    let product_id = path.into_inner();

    match inventory_service.get_inventory_by_product_id(&product_id).await {
        Ok(Some(inventory)) => HttpResponse::Ok().json(inventory),
        Ok(None) => HttpResponse::NotFound().json(json!({"message": "Inventory not found for product"})),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({"message": "Internal Server Error"}))
        }
    }
}