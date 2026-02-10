from fastapi import FastAPI, Response # Add Response
import os
from .api.endpoints import checkout
import asyncio
import httpx # Added import for httpx
from .core.kafka_consumer import KafkaConsumerManager
from .infrastructure.repositories.saga_repository import SagaRepository
import checkout_orchestrator.core.config as config
from checkout_orchestrator.core.config import database, kafka_producer, httpx_client, KAFKA_BOOTSTRAP_SERVERS, registry, MOCK_KAFKA # Import shared instances and MOCK_KAFKA

kafka_consumer_manager: KafkaConsumerManager = None

app = FastAPI(title="Checkout Orchestrator")

app.include_router(checkout.router, prefix="/api", tags=["Checkout"])

# Prometheus Metrics Endpoint
@app.get("/metrics")
async def metrics():
    # Only generate metrics if Kafka is not mocked
    if not MOCK_KAFKA:
        from prometheus_client import generate_latest # Moved import here to avoid issue when Kafka is mocked.
        return Response(content=generate_latest(registry).decode("utf-8"), media_type="text/plain")
    return Response(content="Kafka is mocked, metrics not available.", media_type="text/plain")


@app.on_event("startup")
async def startup_db_kafka():
    await database.connect()
    print("Connected to database.")

    if not MOCK_KAFKA:
        await kafka_producer.start()
        print("Kafka producer started.")
    else:
        print("Kafka producer is mocked, skipping startup.")

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

    if not MOCK_KAFKA:
        kafka_consumer_manager = KafkaConsumerManager(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            database=database,
            saga_repository=saga_repository,
            producer=kafka_producer,
            httpx_client=config.httpx_client,
        )
        asyncio.create_task(kafka_consumer_manager.start_consumer())
        print("Kafka consumer manager started.")
    else:
        kafka_consumer_manager = None
        print("Kafka consumer manager is mocked, skipping startup.")


@app.on_event("shutdown")
async def shutdown_db_kafka():
    await database.disconnect()
    if not MOCK_KAFKA:
        await kafka_producer.stop()
        if kafka_consumer_manager:
            await kafka_consumer_manager.stop_consumer()
        print("Disconnected from database and Kafka producer/consumer stopped.")
    else:
        print("Disconnected from database. Kafka producer/consumer mocked, skipping shutdown.")
    if config.httpx_client is not None:
        await config.httpx_client.aclose()
        config.httpx_client = None
    print("Disconnected from the httpx_client")
