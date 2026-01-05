use product_lookup_rust::{product_lookup, DbProductRepository, MyProductLookup};
use sqlx::PgPool;
use std::{env, sync::Arc};
use tonic::transport::Server;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url =
        env::var("DATABASE_URL").expect("DATABASE_URL must be set for main function");
    let pool = PgPool::connect(&database_url).await?;

    let addr = "[::1]:50051".parse()?;
    let db_repo = DbProductRepository::new(pool);
    let lookup_service = MyProductLookup::new(Arc::new(db_repo));

    println!("ProductLookupServer listening on {}", addr);

    Server::builder()
        .add_service(
            product_lookup::product_lookup_server::ProductLookupServer::new(lookup_service),
        )
        .serve(addr)
        .await?;

    Ok(())
}

