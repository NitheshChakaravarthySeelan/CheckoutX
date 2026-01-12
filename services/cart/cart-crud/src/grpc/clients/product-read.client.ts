import * as grpc from "@grpc/grpc-js";
import { ProductReadServiceClient } from "#proto/product_read_service.js";
import { Product } from "#proto/product.js";

export class ProductReadGrpcClient {
  private client: ProductReadServiceClient;

  constructor(address: string) {
    this.client = new ProductReadServiceClient(
      address,
      grpc.credentials.createInsecure(), // Use insecure for development, secure for production
    );
  }

  async getProductDetails(productId: string): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      this.client.getProductDetails(
        { productId },
        (error: any, response: Product) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }
}
