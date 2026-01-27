import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  reactCompiler: true,
  env: {
    AUTH_SERVICE_GRPC_URL:
      process.env.AUTH_SERVICE_GRPC_URL || "localhost:50051",
    PRODUCT_READ_GRPC_URL:
      process.env.PRODUCT_READ_GRPC_URL || "localhost:50052",
    INVENTORY_GRPC_URL: process.env.INVENTORY_GRPC_URL || "localhost:50053",
    CART_GRPC_URL: process.env.CART_GRPC_URL || "localhost:50050",
  },
};

export default nextConfig;
