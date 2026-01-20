from fastapi import FastAPI, Response # Add Response
import os
from .api.endpoints import checkout
import asyncio
import httpx # Added import for httpx
from .core.kafka_consumer import KafkaConsumerManager
from .infrastructure.repositories.saga_repository import SagaRepository
import checkout_orchestrator.core.config as config
from checkout_orchestrator.core.config import database, kafka_producer, httpx_client, KAFKA_BOOTSTRAP_SERVERS, registry # Import shared instances

kafka_consumer_manager: KafkaConsumerManager = None

app = FastAPI(title="Checkout Orchestrator")

app.include_router(checkout.router, prefix="/api", tags=["Checkout"])

# Prometheus Metrics Endpoint
@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(registry).decode("utf-8"), media_type="text/plain")

@app.on_event("startup")
async def startup_db_kafka():
    await database.connect()
    await kafka_producer.start()
    print("Connected to database and Kafka producer started.")

    # Initializing httpx connection
    # httpx_client is already declared in config.py, now initialize it
    config.httpx_client = httpx.AsyncClient(
        timeout= httpx.Timeout(
            connect=5.0,
            read=10.0,
            write=10.0,
            pool=5.0,
        ),
        limits=httpx.Limits(
            max_connections=100,
            max_keepalive_connections=20,
        ),
    )
    print("httpx_client is successfully initialized")

    # Initialize and start Kafka Consumer Manager
    global kafka_consumer_manager
    saga_repository = SagaRepository(database)
    await saga_repository.create_saga_table() # Ensure saga table is created on startup
    kafka_consumer_manager = KafkaConsumerManager(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        database=database,
        saga_repository=saga_repository,
        producer=kafka_producer,
        httpx_client=config.httpx_client,
    )
    asyncio.create_task(kafka_consumer_manager.start_consumer())
    print("Kafka consumer manager started.")


@app.on_event("shutdown")
async def shutdown_db_kafka():
    await database.disconnect()
    await kafka_producer.stop()
    if kafka_consumer_manager:
        await kafka_consumer_manager.stop_consumer()
    print("Disconnected from database and Kafka producer/consumer stopped.")
    if config.httpx_client is not None:
        await config.httpx_client.aclose()
        config.httpx_client = None
    print("Disconnected from the httpx_client")
