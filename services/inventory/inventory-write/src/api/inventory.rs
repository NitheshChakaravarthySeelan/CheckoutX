// services/inventory/inventory-write/src/api/inventory.rs
// Handlers for inventory-related routes.

use actix_web::{web, HttpResponse, Responder};
use crate::domain::service::InventoryService;
#[allow(unused_imports)]
use crate::domain::model::{UpdateStockRequest, InventoryItem};
use serde_json::json;
use uuid::Uuid; // Added import for Uuid

pub async fn update_inventory(
    path: web::Path<String>,
    request: web::Json<UpdateStockRequest>,
    inventory_service: web::Data<InventoryService>,
) -> impl Responder {
    let product_id_str = path.into_inner();
    let product_id = match Uuid::parse_str(&product_id_str) {
        Ok(uuid) => uuid,
        Err(_) => return HttpResponse::BadRequest().json(json!({"message": "Invalid product ID format"})),
    };

    match inventory_service.update_inventory(product_id, request.into_inner()).await {
        Ok(inventory) => HttpResponse::Ok().json(inventory),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({"message": "Internal Server Error"}))
        }
    }
}