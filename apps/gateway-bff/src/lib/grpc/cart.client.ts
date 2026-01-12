import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { CartServiceClient, CartServiceService } from "@proto/cart";
import {
  CartResponse,
  AddItemToCartRequest,
  UpdateItemQuantityRequest,
  RemoveItemFromCartRequest,
  GetCartRequest,
} from "@proto/cart";
import { makeGenericClientConstructor } from "@grpc/grpc-js"; // Import makeGenericClientConstructor

const PROTO_PATH = "../../shared/proto/cart.proto";

export class CartGrpcClient {
  private client: CartServiceClient;

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
      CartServiceService,
      "cart.CartService",
    ))(
      address,
      grpc.credentials.createInsecure(),
    ) as unknown as CartServiceClient;
  }

  async addItemToCart(
    userId: string,
    productId: string,
    quantity: number,
    metadata?: grpc.Metadata,
  ): Promise<CartResponse> {
    return new Promise((resolve, reject) => {
      this.client.addItemToCart(
        { userId, productId, quantity },
        metadata || new grpc.Metadata(),
        (error: grpc.ServiceError | null, response: CartResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
    metadata?: grpc.Metadata,
  ): Promise<CartResponse> {
    return new Promise((resolve, reject) => {
      this.client.updateItemQuantity(
        { userId, productId, quantity },
        metadata || new grpc.Metadata(),
        (error: grpc.ServiceError | null, response: CartResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  async removeItemFromCart(
    userId: string,
    productId: string,
    metadata?: grpc.Metadata,
  ): Promise<CartResponse> {
    return new Promise((resolve, reject) => {
      this.client.removeItemFromCart(
        { userId, productId },
        metadata || new grpc.Metadata(),
        (error: grpc.ServiceError | null, response: CartResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  async getCart(
    userId: string,
    metadata?: grpc.Metadata,
  ): Promise<CartResponse> {
    return new Promise((resolve, reject) => {
      this.client.getCart(
        { userId },
        metadata || new grpc.Metadata(),
        (error: grpc.ServiceError | null, response: CartResponse) => {
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
