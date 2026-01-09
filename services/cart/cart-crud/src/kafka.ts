import { Kafka, type EachMessagePayload } from "kafkajs";
import { CartService } from "./services/cart.service.js";
import { z } from "zod";

const kafka = new Kafka({
  clientId: "cart-service",
  brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092").split(","),
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "cart-group" });

// Define schemas for Kafka event messages
const OrderCreatedEventSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    }),
  ),
  totalPrice: z.number().positive(),
  timestamp: z.string().datetime(),
});

type OrderCreatedEvent = z.infer<typeof OrderCreatedEventSchema>;

export async function initKafka(cartService: CartService) {
  if (process.env.ENABLE_KAFKA === "true") {
    await producer.connect();
    await consumer.connect();

    // Subscribe to topics
    await consumer.subscribe({ topic: "order-created", fromBeginning: true });

    await consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        if (!message.value) {
          console.warn(
            `Received null or undefined message value for topic ${topic}`,
          );
          return;
        }

        const stringValue = message.value.toString();

        try {
          switch (topic) {
            case "order-created":
              const event: OrderCreatedEvent = OrderCreatedEventSchema.parse(
                JSON.parse(stringValue),
              );
              console.log(`Received OrderCreatedEvent:`, event);
              // Deduct product quantities from carts or handle as needed
              // For a cart service, this might involve clearing the cart for the user
              // cartService.clearCart(event.userId); // Example action
              break;
            default:
              console.log(`Received message on topic ${topic}: ${stringValue}`);
          }
        } catch (error) {
          console.error(
            `Error processing Kafka message on topic ${topic}:`,
            error,
          );
          // Potentially move to a dead-letter queue or log for manual inspection
        }
      },
    });
    console.log("Kafka producer and consumer connected and subscribed.");
  } else {
    console.log("Kafka is disabled. Set ENABLE_KAFKA=true to enable.");
  }
}

export async function disconnectKafka() {
  await producer.disconnect();
  await consumer.disconnect();
  console.log("Kafka producer and consumer disconnected.");
}

export async function sendKafkaMessage(topic: string, message: object) {
  if (process.env.ENABLE_KAFKA === "true") {
    try {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      console.log(`Message sent to topic ${topic}`);
    } catch (error) {
      console.error(`Error sending message to Kafka topic ${topic}:`, error);
    }
  } else {
    console.log(`Kafka is disabled. Message to topic ${topic} was not sent.`);
  }
}
