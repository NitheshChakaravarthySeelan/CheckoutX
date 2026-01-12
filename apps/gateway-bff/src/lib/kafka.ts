import { Kafka, Producer } from "kafkajs";
import config from "../../next.config"; // Adjust path if needed
import { v4 as uuidv4 } from "uuid"; // For saga_id

let producer: Producer | null = null;

const kafka = new Kafka({
  clientId: "gateway-bff",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
});

export async function connectKafkaProducer() {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
    console.log("Kafka producer connected");
  }
}

export async function disconnectKafkaProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
    console.log("Kafka producer disconnected");
  }
}

interface CheckoutInitiatedEventPayload {
  saga_id: string;
  user_id: string;
  cart_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price_cents: number;
    name: string;
    image_url: string;
  }>;
  total_price_cents: number;
  total_discount_cents: number;
  total_tax_cents: number;
}

export async function publishCheckoutInitiatedEvent(
  payload: CheckoutInitiatedEventPayload,
) {
  if (!producer) {
    throw new Error("Kafka producer not connected.");
  }

  await producer.send({
    topic: "checkout.checkout-events", // Topic as per architecture doc
    messages: [
      {
        key: uuidv4(), // Use saga_id as key or a new UUID
        value: JSON.stringify(payload),
        headers: {
          eventType: "CheckoutInitiatedEvent",
        },
      },
    ],
  });
  console.log(
    `Published CheckoutInitiatedEvent for saga_id: ${payload.saga_id}`,
  );
}
