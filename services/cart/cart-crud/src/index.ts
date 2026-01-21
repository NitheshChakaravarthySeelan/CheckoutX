import "dotenv/config"; // Load environment variables as early as possible
import app, { cartService } from "./app.js"; // Use ES Module import and import cartService
import { initKafka, disconnectKafka } from "./kafka.js"; // Import Kafka functions
import { startGrpcServer } from "./grpc/cart.service.js"; // Import gRPC server startup function
import config from "./config/index.js"; // Import config
import { initDatabase } from "./utils/db.js"; // Import database initializer

const port = process.env.PORT || 3000;
const grpcPort = config.grpcPort;

let grpcServer: any; // Define a variable to hold the gRPC server instance

// Initialize Kafka and start the server
const startServer = async () => {
  try {
    await initDatabase(); // Ensure schema is created before starting
    await initKafka(cartService);
    app.listen(port, () => {
      console.log(`Express server is running on http://localhost:${port}`);
    });

    // Start gRPC server
    grpcServer = startGrpcServer(cartService, String(grpcPort));
  } catch (error) {
    console.error("Failed to start server or Kafka:", error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await disconnectKafka();
  if (grpcServer) {
    grpcServer.forceShutdown(); // Force shutdown the gRPC server
    console.log("gRPC server shut down.");
  }
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
