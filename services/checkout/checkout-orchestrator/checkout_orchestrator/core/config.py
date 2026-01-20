import os
from databases import Database
from aiokafka import AIOKafkaProducer
import httpx # Import httpx
from prometheus_client import CollectorRegistry # Import CollectorRegistry
from dotenv import load_dotenv # Import load_dotenv

load_dotenv() # Load environment variables from .env file

# Conditionally set DATABASE_URL
if os.getenv("USE_IN_MEMORY_DB", "false").lower() == "true":
    DATABASE_URL = "sqlite:///:memory:" # In-memory SQLite for testing/dev
    print("Using in-memory SQLite database.")
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:secret@postgres_dev:5432/community_platform")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")

database = Database(DATABASE_URL)
kafka_producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS)

# Initialize httpx_client globally, but connect/close in app startup/shutdown events
httpx_client: httpx.AsyncClient = None

# Prometheus Registry
registry = CollectorRegistry()
