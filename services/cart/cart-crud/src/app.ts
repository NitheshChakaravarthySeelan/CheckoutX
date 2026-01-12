import express, { type Request, type Response } from "express"; // Use type imports
import { createCartRoutes } from "./routes/cart.routes.js";
import * as client from "prom-client";
import { CartService } from "./services/cart.service.js";
import { PostgresCartRepository } from "./repositories/PostgresCartRepository.js";
import config from "./config/index.js";
import { ProductReadGrpcClient } from "./grpc/clients/product-read.client.js"; // Import gRPC client
import { InventoryReadGrpcClient } from "./grpc/clients/inventory-read.client.js"; // Import gRPC client

const app: express.Application = express(); // Explicitly type app

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Cart CRUD Service is running!");
});

// Prometheus Metrics Endpoint
app.get("/metrics", async (req: Request, res: Response) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// Register default metrics
client.collectDefaultMetrics();

// Instantiate dependencies
const cartRepository = new PostgresCartRepository();
// Instantiate gRPC clients
const productReadGrpcClient = new ProductReadGrpcClient(
  config.productReadGrpcUrl,
);
const inventoryReadGrpcClient = new InventoryReadGrpcClient(
  config.inventoryReadGrpcUrl,
);

export const cartService = new CartService(
  cartRepository,
  productReadGrpcClient,
  inventoryReadGrpcClient,
);

// Use the createCartRoutes function to get the router
app.use("/api/v1/carts", createCartRoutes(cartService));

export default app;
