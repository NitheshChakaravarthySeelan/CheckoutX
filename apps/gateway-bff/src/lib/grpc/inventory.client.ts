import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import {
  InventoryServiceClient,
  InventoryServiceService,
} from "@proto/inventory";
import { CheckStockRequest, CheckStockResponse } from "@proto/inventory";
import { makeGenericClientConstructor } from "@grpc/grpc-js"; // Import makeGenericClientConstructor

const PROTO_PATH = "../../shared/proto/inventory.proto";

export class InventoryGrpcClient {
  private client: InventoryServiceClient;

  constructor(address: string) {
    // Note: packageDefinition is still needed for protoLoader.loadSync, but not for client instantiation directly
    protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    this.client = new (makeGenericClientConstructor(
      InventoryServiceService,
      "inventory.InventoryService",
    ))(
      address,
      grpc.credentials.createInsecure(),
    ) as unknown as InventoryServiceClient;
  }

  async checkStock(
    productId: string,
    quantity: number,
  ): Promise<CheckStockResponse> {
    return new Promise((resolve, reject) => {
      this.client.checkStock(
        { productId, quantity },
        (error: grpc.ServiceError | null, response: CheckStockResponse) => {
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
