import * as grpc from "@grpc/grpc-js";
import { InventoryServiceClient } from "#proto/inventory.js";
import { CheckStockRequest, CheckStockResponse } from "#proto/inventory.js";

export class InventoryReadGrpcClient {
  private client: InventoryServiceClient;

  constructor(address: string) {
    this.client = new InventoryServiceClient(
      address,
      grpc.credentials.createInsecure(), // Use insecure for development, secure for production
    );
  }

  async checkStock(
    productId: string,
    quantity: number,
  ): Promise<CheckStockResponse> {
    return new Promise((resolve, reject) => {
      this.client.checkStock(
        { productId, quantity },
        (error: any, response: CheckStockResponse) => {
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
