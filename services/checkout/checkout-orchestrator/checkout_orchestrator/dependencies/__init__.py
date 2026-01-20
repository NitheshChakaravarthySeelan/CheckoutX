from databases import Database
from aiokafka import AIOKafkaProducer
import httpx
from ..core.services.checkout_service import CheckoutService
from ..infrastructure.repositories.saga_repository import SagaRepository
from ..core.config import database, kafka_producer, httpx_client # Import the shared instances

async def get_database() -> Database:
    return database

async def get_kafka_producer() -> AIOKafkaProducer:
    return kafka_producer

async def get_saga_repository() -> SagaRepository:
    # SagaRepository now always uses the global database instance
    repo = SagaRepository(database)
    # create_saga_table is now called in main.py startup event
    return repo

async def get_checkout_service(
    db: Database = None,
    producer: AIOKafkaProducer = None,
    saga_repo: SagaRepository = None,
    client: httpx.AsyncClient = None # Add client parameter
) -> CheckoutService:
    # Use global instances if not provided (expected in actual app run)
    if db is None:
        db = database
    if producer is None:
        producer = kafka_producer
    if saga_repo is None:
        saga_repo = await get_saga_repository()
    if client is None: # Use the global httpx_client from config if not provided
        client = httpx_client
    
    return CheckoutService(db, producer, saga_repo, client) # Pass client to CheckoutService