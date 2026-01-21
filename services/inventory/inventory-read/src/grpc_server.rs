// services/inventory/inventory-read/src/grpc_server.rs

use tonic::{Request, Response, Status};
use inventory_read::domain::service::InventoryService;

use inventory_read::inventory_proto::inventory_service_server::InventoryService as InventoryServiceTrait;
use inventory_read::inventory_proto::{CheckStockRequest, CheckStockResponse};

#[derive(Debug)]
pub struct InventoryGrpcService {
    inventory_service: InventoryService, // The concrete domain service
}

impl InventoryGrpcService {
    pub fn new(inventory_service: InventoryService) -> Self {
        InventoryGrpcService { inventory_service }
    }
}

#[tonic::async_trait]
impl InventoryServiceTrait for InventoryGrpcService {
    async fn check_stock(
        &self,
        request: Request<CheckStockRequest>,
    ) -> Result<Response<CheckStockResponse>, Status> {
        let req = request.into_inner();
        let product_id_str = req.product_id;
        let requested_quantity = req.quantity;

        // Call the domain service
        let inventory_result = self
            .inventory_service
            .get_inventory_by_product_id(&product_id_str)
            .await;

        match inventory_result {
            Ok(Some(inventory)) => {
                let available = inventory.quantity_available >= requested_quantity;
                let message = if available {
                    "Stock available".to_string()
                } else {
                    format!(
                        "Not enough stock. Available: {}, Requested: {}",
                        inventory.quantity_available, requested_quantity
                    )
                };

                let reply = CheckStockResponse {
                    product_id: product_id_str,
                    available,
                    current_stock: inventory.quantity_available,
                    message,
                };
                Ok(Response::new(reply))
            }
            Ok(None) => Err(Status::not_found(format!(
                "Product with ID {} not found in inventory",
                product_id_str
            ))),
            Err(e) => Err(Status::internal(format!(
                "Internal inventory service error: {}",
                e
            ))),
        }
    }
}
