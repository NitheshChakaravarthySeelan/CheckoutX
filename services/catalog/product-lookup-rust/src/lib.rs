use tonic::{Request, Response, Status};
use crate::product_lookup::{
    product_lookup_server::{ProductLookup},
    GetProductByIdRequest, Product,
};
use sqlx::{FromRow, Pool, Postgres};
use std::sync::Arc; // Needed for Arc
use async_trait::async_trait; // Needed for async_trait macro

pub mod product_lookup {
    tonic::include_proto!("product_lookup");
}

#[derive(FromRow, Debug, Clone)]
pub struct ProductRow {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
    pub price: Option<f64>,
    pub quantity: Option<i32>,
    pub sku: Option<String>,
    pub image_url: Option<String>,
    pub category: Option<String>,
    pub manufacturer: Option<String>,
    pub status: Option<String>,
    pub version: Option<i32>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[async_trait]
pub trait ProductRepository: Send + Sync {
    async fn find_product_by_id(&self, id: &str) -> Result<Option<ProductRow>, sqlx::Error>;
}

pub struct DbProductRepository {
    pool: Pool<Postgres>,
}

impl DbProductRepository {
    pub fn new(pool: Pool<Postgres>) -> Self {
        DbProductRepository { pool }
    }
}

#[async_trait]
impl ProductRepository for DbProductRepository {
    async fn find_product_by_id(&self, id: &str) -> Result<Option<ProductRow>, sqlx::Error> {
        sqlx::query_as(
            r#"
            SELECT id, name, description, price, quantity, sku, image_url, category, manufacturer, status, version, created_at, updated_at
            FROM products WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
    }
}

pub struct MyProductLookup {
    repository: Arc<dyn ProductRepository + Send + Sync>,
}

impl MyProductLookup {
    pub fn new(repository: Arc<dyn ProductRepository + Send + Sync>) -> Self {
        MyProductLookup { repository }
    }
}

#[tonic::async_trait]
impl ProductLookup for MyProductLookup {
    async fn get_product_by_id(
        &self,
        request: Request<GetProductByIdRequest>,
    ) -> Result<Response<Product>, Status> {
        let id = request.into_inner().id;

        let row = self.repository.find_product_by_id(&id).await
            .map_err(|e| Status::internal(format!("Database error: {}", e)))?
            .ok_or_else(|| Status::not_found(format!("Product with ID {} not found", id)))?;

        let product = Product {
            id: row.id,
            name: row.name.unwrap_or_default(),
            description: row.description.unwrap_or_default(),
            price: row.price.unwrap_or(0.0),
            quantity: row.quantity.unwrap_or(0),
            sku: row.sku.unwrap_or_default(),
            image_url: row.image_url.unwrap_or_default(),
            category: row.category.unwrap_or_default(),
            manufacturer: row.manufacturer.unwrap_or_default(),
            status: row.status.unwrap_or_default(),
            version: row.version.unwrap_or(0) as i64,
            created_at: row.created_at.to_string(),
            updated_at: row.updated_at.to_string(),
        };

        Ok(Response::new(product))
    }
}