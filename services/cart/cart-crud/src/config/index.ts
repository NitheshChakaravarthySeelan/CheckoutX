import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  grpcPort: process.env.GRPC_PORT || 50050,
  databaseUrl:
    process.env.DATABASE_URL || "mongodb://localhost:27017/cart-service",
  jwtSecret: process.env.JWT_SECRET || "supersecretjwtkey",
  stripeSecretKey:
    process.env.STRIPE_SECRET_KEY || "sk_test_your_stripe_secret_key",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://localhost",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  nodeEnv: process.env.NODE_ENV || "development",
  productReadGrpcUrl: process.env.PRODUCT_READ_GRPC_URL || "localhost:50051",
  inventoryReadGrpcUrl:
    process.env.INVENTORY_READ_GRPC_URL || "localhost:50052",
  discountEngineUrl: process.env.DISCOUNT_ENGINE_URL || "http://localhost:8080",
  taxCalculationUrl: process.env.TAX_CALCULATION_URL || "http://localhost:8081",
  productServiceUrl:
    process.env.PRODUCT_SERVICE_BASE_URL || "http://localhost:3002",
};

export default config;
