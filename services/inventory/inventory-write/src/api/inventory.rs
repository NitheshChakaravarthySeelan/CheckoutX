// services/inventory/inventory-write/src/api/inventory.rs
// Handlers for inventory-related routes.

use actix_web::{web, HttpResponse, Responder};
use crate::domain::service::InventoryService;
#[allow(unused_imports)]
use crate::domain::model::{UpdateStockRequest, InventoryItem};
use serde_json::json;

pub async fn update_inventory(
    path: web::Path<String>,
    request: web::Json<UpdateStockRequest>,
    inventory_service: web::Data<InventoryService>,
) -> impl Responder {
    let product_id = path.into_inner();

    match inventory_service.update_inventory(&product_id, request.into_inner()).await {
        Ok(inventory) => HttpResponse::Ok().json(inventory),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            HttpResponse::InternalServerError().json(json!({"message": "Internal Server Error"}))
        }
    }
}