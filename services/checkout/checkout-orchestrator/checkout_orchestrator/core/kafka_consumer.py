from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from databases import Database
from checkout_orchestrator.infrastructure.repositories.saga_repository import SagaRepository
from checkout_orchestrator.api.schemas.saga import SagaState
import asyncio
import json
import logging
from typing import Dict, Any
import uuid
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define Kafka Topics (same as in CheckoutService for consistency)
KAFKA_TOPIC_CHECKOUT_INITIATED = "checkout.checkout-initiated"
KAFKA_TOPIC_INVENTORY_COMMAND = "checkout.inventory-command"
KAFKA_TOPIC_PAYMENT_COMMAND = "checkout.payment-command"
KAFKA_TOPIC_ORDER_COMMAND = "checkout.order-command"
KAFKA_TOPIC_CART_COMMAND = "checkout.cart-command"
KAFKA_TOPIC_CHECKOUT_EVENTS = "checkout.checkout-events" # For events like InventoryReserved, PaymentProcessed, OrderCreated etc.

# Saga States
SAGA_STATE_INITIATED = "CHECKOUT_INITIATED"
SAGA_STATE_INVENTORY_RESERVATION_PENDING = "INVENTORY_RESERVATION_PENDING"
SAGA_STATE_INVENTORY_RESERVED = "INVENTORY_RESERVED"
SAGA_STATE_PAYMENT_PROCESSING_PENDING = "PAYMENT_PROCESSING_PENDING"
SAGA_STATE_PAYMENT_PROCESSED = "PAYMENT_PROCESSED"
SAGA_STATE_ORDER_CREATION_PENDING = "ORDER_CREATION_PENDING"
SAGA_STATE_ORDER_CREATED = "ORDER_CREATED"
SAGA_STATE_CART_CLEARANCE_PENDING = "CART_CLEARANCE_PENDING"
SAGA_STATE_COMPLETED = "COMPLETED"
SAGA_STATE_FAILED = "FAILED"
SAGA_STATE_COMPENSATING = "COMPENSATING"

class KafkaConsumerManager:
    def __init__(
        self,
        bootstrap_servers: str,
        database: Database,
        saga_repository: SagaRepository,
        producer: AIOKafkaProducer
    ):
        self.consumer = AIOKafkaConsumer(
            KAFKA_TOPIC_CHECKOUT_INITIATED,
            KAFKA_TOPIC_CHECKOUT_EVENTS, # Consumer needs to listen to events from other services
            bootstrap_servers=bootstrap_servers,
            group_id="checkout-orchestrator-group",
            auto_offset_reset="earliest"
        )
        self.database = database
        self.saga_repository = saga_repository
        self.producer = producer
        self.running = False

    async def start_consumer(self):
        logger.info("Starting Kafka consumer...")
        await self.consumer.start()
        self.running = True
        try:
            # Consume messages
            async for msg in self.consumer:
                logger.info(f"Consumed message: topic={msg.topic}, partition={msg.partition}, offset={msg.offset}, key={msg.key}, value={msg.value.decode('utf-8')}")
                await self.process_message(msg)
        except asyncio.CancelledError:
            logger.info("Kafka consumer task cancelled.")
        finally:
            await self.consumer.stop()
            self.running = False
            logger.info("Kafka consumer stopped.")

    async def stop_consumer(self):
        if self.running:
            await self.consumer.stop()
            self.running = False

    async def process_message(self, msg):
        try:
            event_data = json.loads(msg.value.decode('utf-8'))
            saga_id = event_data.get("saga_id")
            event_type = event_data.get("type", "UNKNOWN_EVENT")
            event_id = event_data.get("event_id", f"{msg.topic}-{msg.partition}-{msg.offset}") # Use event_id from payload or Kafka offset

            if not saga_id:
                logger.warning(f"Received event without saga_id: {event_data}")
                return

            saga_state = await self.saga_repository.get(saga_id)
            if not saga_state:
                logger.warning(f"Saga state not found for saga_id: {saga_id}. Event: {event_data}")
                # Potentially a late event or error in initial saga creation.
                # If this is CheckoutInitiated, it means initial create failed.
                if event_type == "CheckoutInitiated":
                    logger.error(f"CheckoutInitiated event received but saga_state not found for {saga_id}. Possible initial saga creation failure.")
                return

            # Idempotency Check
            if event_id in saga_state.processed_event_ids:
                logger.info(f"Event {event_id} for saga {saga_id} already processed. Skipping.")
                return

            # Add event_id to processed list and update saga state BEFORE processing
            saga_state.processed_event_ids.append(event_id)

            logger.info(f"Processing event '{event_type}' with event_id '{event_id}' for saga '{saga_id}' in state '{saga_state.state}'")

            # Saga orchestration logic based on current state and event type
            if event_type == "CheckoutInitiated" and saga_state.state == SAGA_STATE_INITIATED:
                await self.handle_checkout_initiated(saga_state, event_data)
            elif event_type == "InventoryReserved" and saga_state.state == SAGA_STATE_INVENTORY_RESERVATION_PENDING:
                await self.handle_inventory_reserved(saga_state, event_data)
            elif event_type == "InventoryReservationFailed" and saga_state.state == SAGA_STATE_INVENTORY_RESERVATION_PENDING:
                await self.handle_inventory_reservation_failed(saga_state, event_data)
            elif event_type == "PaymentProcessed" and saga_state.state == SAGA_STATE_PAYMENT_PROCESSING_PENDING:
                await self.handle_payment_processed(saga_state, event_data)
            elif event_type == "PaymentFailed" and saga_state.state == SAGA_STATE_PAYMENT_PROCESSING_PENDING:
                await self.handle_payment_failed(saga_state, event_data)
            elif event_type == "OrderCreated" and saga_state.state == SAGA_STATE_ORDER_CREATION_PENDING:
                await self.handle_order_created(saga_state, event_data)
            elif event_type == "OrderCreationFailed" and saga_state.state == SAGA_STATE_ORDER_CREATION_PENDING:
                await self.handle_order_creation_failed(saga_state, event_data)
            elif event_type == "CartCleared" and saga_state.state == SAGA_STATE_CART_CLEARANCE_PENDING:
                await self.handle_cart_cleared(saga_state, event_data)
            elif event_type == "CartClearanceFailed" and saga_state.state == SAGA_STATE_CART_CLEARANCE_PENDING:
                await self.handle_cart_clearance_failed(saga_state, event_data)
            else:
                logger.warning(f"No handler for event_type '{event_type}' in state '{saga_state.state}' for saga {saga_id}")

            # Persist updated saga state after processing
            saga_state.updated_at = datetime.datetime.now(datetime.timezone.utc)
            await self.saga_repository.update(saga_state)

        except json.JSONDecodeError:
            logger.error(f"Failed to decode JSON from Kafka message: {msg.value.decode('utf-8')}")
        except Exception as e:
            logger.error(f"Error processing Kafka message for saga {saga_id}: {e}", exc_info=True)

    async def handle_checkout_initiated(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.info(f"Handling CheckoutInitiated event for saga {saga_state.id}")

        # Update saga state to pending inventory reservation
        saga_state.state = SAGA_STATE_INVENTORY_RESERVATION_PENDING
        saga_state.context["current_step"] = "INVENTORY_RESERVATION_SENT"

        # Publish command to Inventory Service
        inventory_command_payload = {
            "type": "ReserveInventory",
            "saga_id": saga_state.id,
            "cart_id": saga_state.context["cart_id"],
            "user_id": saga_state.context["user_id"],
            "items": saga_state.context["cart_details"]["items"],
            "event_id": str(uuid.uuid4()), # Unique ID for this command/event
            "reply_to_topic": KAFKA_TOPIC_CHECKOUT_EVENTS, # Inventory service should reply here
        }
        await self.producer.send_and_wait(
            KAFKA_TOPIC_INVENTORY_COMMAND,
            json.dumps(inventory_command_payload).encode('utf-8')
        )
        logger.info(f"Published ReserveInventory command for saga {saga_state.id}")

    async def handle_inventory_reserved(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.info(f"Handling InventoryReserved event for saga {saga_state.id}")
        saga_state.state = SAGA_STATE_PAYMENT_PROCESSING_PENDING
        saga_state.context["current_step"] = "PAYMENT_REQUEST_SENT"
        saga_state.context["inventory_reservation_details"] = event_data.get("reservation_details")

        # Need to make sync post request for the discount and tax
        payment_discount_payload = {

        }
        # Publish command to Payment Service
        payment_command_payload = {
            "type": "ProcessPayment",
            "saga_id": saga_state.id,
            "user_id": saga_state.context["user_id"],
            "amount": saga_state.context["cart_details"]["total_price"], # Assuming cart_details has total_price
            "event_id": str(uuid.uuid4()),
            "reply_to_topic": KAFKA_TOPIC_CHECKOUT_EVENTS,
        }
        await self.producer.send_and_wait(
            KAFKA_TOPIC_PAYMENT_COMMAND,
            json.dumps(payment_command_payload).encode('utf-8')
        )
        logger.info(f"Published ProcessPayment command for saga {saga_state.id}")

    async def handle_inventory_reservation_failed(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.error(f"Handling InventoryReservationFailed event for saga {saga_state.id}. Reason: {event_data.get('reason')}")
        saga_state.state = SAGA_STATE_FAILED
        saga_state.context["current_step"] = "INVENTORY_RESERVATION_FAILED"
        saga_state.context["errors"].append({"step": "inventory", "reason": event_data.get("reason")})
        # For inventory reservation failure, typically the inventory service handles any partial reservations or rollbacks.
        # The orchestrator simply marks the saga as failed. No explicit compensation command from orchestrator.
        logger.info(f"Saga {saga_state.id} marked as FAILED due to inventory reservation failure.")

    async def handle_payment_processed(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.info(f"Handling PaymentProcessed event for saga {saga_state.id}")
        saga_state.state = SAGA_STATE_ORDER_CREATION_PENDING
        saga_state.context["current_step"] = "ORDER_CREATION_SENT"
        saga_state.context["payment_details"] = event_data.get("payment_details")

        # Publish command to Order Service
        order_command_payload = {
            "type": "CreateOrder",
            "saga_id": saga_state.id,
            "user_id": saga_state.context["user_id"],
            "cart_details": saga_state.context["cart_details"],
            "payment_details": saga_state.context["payment_details"],
            "inventory_reservation_details": saga_state.context["inventory_reservation_details"],
            "event_id": str(uuid.uuid4()),
            "reply_to_topic": KAFKA_TOPIC_CHECKOUT_EVENTS,
        }
        await self.producer.send_and_wait(
            KAFKA_TOPIC_ORDER_COMMAND,
            json.dumps(order_command_payload).encode('utf-8')
        )
        logger.info(f"Published CreateOrder command for saga {saga_state.id}")

    async def handle_payment_failed(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.error(f"Handling PaymentFailed event for saga {saga_state.id}. Reason: {event_data.get('reason')}")
        saga_state.state = SAGA_STATE_COMPENSATING
        saga_state.context["current_step"] = "PAYMENT_FAILED_COMPENSATION_PENDING"
        saga_state.context["errors"].append({"step": "payment", "reason": event_data.get("reason")})
        # Publish compensating transaction to Inventory Service (release reservation)
        await self._publish_compensate_inventory_command(saga_state)
        logger.info(f"Saga {saga_state.id} marked as COMPENSATING due to payment failure.")

    async def handle_order_created(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.info(f"Handling OrderCreated event for saga {saga_state.id}")
        saga_state.state = SAGA_STATE_CART_CLEARANCE_PENDING
        saga_state.context["current_step"] = "CART_CLEARANCE_SENT"
        saga_state.context["order_details"] = event_data.get("order_details")

        # Publish command to Cart Service to clear cart
        cart_command_payload = {
            "type": "ClearCart",
            "saga_id": saga_state.id,
            "user_id": saga_state.context["user_id"],
            "cart_id": saga_state.context["cart_id"],
            "event_id": str(uuid.uuid4()),
            "reply_to_topic": KAFKA_TOPIC_CHECKOUT_EVENTS,
        }
        await self.producer.send_and_wait(
            KAFKA_TOPIC_CART_COMMAND,
            json.dumps(cart_command_payload).encode('utf-8')
        )
        logger.info(f"Published ClearCart command for saga {saga_state.id}")

    async def handle_order_creation_failed(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.error(f"Handling OrderCreationFailed event for saga {saga_state.id}. Reason: {event_data.get('reason')}")
        saga_state.state = SAGA_STATE_COMPENSATING
        saga_state.context["current_step"] = "ORDER_CREATION_FAILED_COMPENSATION_PENDING"
        saga_state.context["errors"].append({"step": "order_creation", "reason": event_data.get("reason")})
        # Publish compensating transactions
        await self._publish_compensate_payment_command(saga_state)
        await self._publish_compensate_inventory_command(saga_state)
        logger.info(f"Saga {saga_state.id} marked as COMPENSATING due to order creation failure.")

    async def handle_cart_cleared(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.info(f"Handling CartCleared event for saga {saga_state.id}")
        saga_state.state = SAGA_STATE_COMPLETED
        saga_state.context["current_step"] = "SAGA_COMPLETED"
        logger.info(f"Saga {saga_state.id} completed successfully.")

    async def handle_cart_clearance_failed(self, saga_state: SagaState, event_data: Dict[str, Any]):
        logger.error(f"Handling CartClearanceFailed event for saga {saga_state.id}. Reason: {event_data.get('reason')}")
        saga_state.state = SAGA_STATE_COMPENSATING
        saga_state.context["current_step"] = "CART_CLEARANCE_FAILED_COMPENSATION_PENDING"
        saga_state.context["errors"].append({"step": "cart_clearance", "reason": event_data.get("reason")})
        # Compensating transactions already published by previous failures or if this is the only one.
        logger.info(f"Saga {saga_state.id} marked as COMPENSATING due to cart clearance failure.")

    async def _publish_compensate_inventory_command(self, saga_state: SagaState):
        logger.info(f"Publishing CompensateInventory command for saga {saga_state.id}")
        compensate_payload = {
            "type": "CompensateInventory",
            "saga_id": saga_state.id,
            "user_id": saga_state.context["user_id"],
            "cart_id": saga_state.context["cart_id"],
            "items": saga_state.context["cart_details"]["items"],
            "reservation_details": saga_state.context.get("inventory_reservation_details"),
            "event_id": str(uuid.uuid4()),
            "reply_to_topic": KAFKA_TOPIC_CHECKOUT_EVENTS,
        }
        await self.producer.send_and_wait(
            KAFKA_TOPIC_INVENTORY_COMMAND,
            json.dumps(compensate_payload).encode('utf-8')
        )

    async def _publish_compensate_payment_command(self, saga_state: SagaState):
        logger.info(f"Publishing CompensatePayment command for saga {saga_state.id}")
        compensate_payload = {
            "type": "CompensatePayment",
            "saga_id": saga_state.id,
            "user_id": saga_state.context["user_id"],
            "payment_details": saga_state.context.get("payment_details"),
            "event_id": str(uuid.uuid4()),
            "reply_to_topic": KAFKA_TOPIC_CHECKOUT_EVENTS,
        }
        await self.producer.send_and_wait(
            KAFKA_TOPIC_PAYMENT_COMMAND,
            json.dumps(compensate_payload).encode('utf-8')
        )
