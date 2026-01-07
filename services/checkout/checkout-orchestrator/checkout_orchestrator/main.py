from fastapi import FastAPI, Response # Add Response
from .api.endpoints import checkout
from databases import Database
from aiokafka import AIOKafkaProducer
import os
import asyncio
from .core.kafka_consumer import KafkaConsumerManager
from .infrastructure.repositories.saga_repository import SagaRepository
from prometheus_client import generate_latest, CollectorRegistry, Gauge, Counter # Import prometheus_client

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:secret@postgres_dev:5432/community_platform")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")

database = Database(DATABASE_URL)
kafka_producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)
kafka_consumer_manager: KafkaConsumerManager = None

app = FastAPI(title="Checkout Orchestrator")

app.include_router(checkout.router, prefix="/api", tags=["Checkout"])

# Prometheus Metrics Endpoint
@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(registry).decode("utf-8"), media_type="text/plain")

@app.on_event("startup")
async def startup_db_kafka():
    global httpx_client
    await database.connect()
    await kafka_producer.start()
    print("Connected to database and Kafka producer started.")

    # Initializing httpx connection
    httpx_client = httpx.AsyncClient(
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
        httpx_client=httpx_client,
    )
    asyncio.create_task(kafka_consumer_manager.start_consumer())
    print("Kafka consumer manager started.")


@app.on_event("shutdown")
async def shutdown_db_kafka():
    global httpx_client
    await database.disconnect()
    await kafka_producer.stop()
    if kafka_consumer_manager:
        await kafka_consumer_manager.stop_consumer()
    print("Disconnected from database and Kafka producer/consumer stopped.")
    if httpx_client is not None:
        await httpx_client.aclose()
        httpx_client = None
    print("Disconnected from the httpx_client")

@app.get("/")
async def read_root():
    return {"message": "Hello from Checkout Orchestrator Service"}

# Add a health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok"}
