import * as grpc from "@grpc/grpc-js";
import { CartService as CartBusinessService } from "../services/cart.service.js"; // Rename to avoid conflict
import type {
  // Add 'type' for type-only imports
  CartServiceServer, // Corrected import
} from "../proto/cart.js"; // Generated gRPC types
import {
  // Keep value imports separate
  CartServiceService,
  CartResponse,
  AddItemToCartRequest,
  UpdateItemQuantityRequest,
  RemoveItemFromCartRequest,
  GetCartRequest,
} from "../proto/cart.js"; // Generated gRPC types
import { Server, ServerCredentials } from "@grpc/grpc-js"; // Value imports
import type {
  ServiceDefinition,
  UntypedServiceImplementation,
} from "@grpc/grpc-js"; // Type-only imports

export class CartGrpcService {
  // [name: string]: grpc.UntypedHandleCall; // Removed problematic index signature

  // Constructor now takes private readonly properties for better type safety
  constructor(private readonly cartBusinessService: CartBusinessService) {
    // Dynamically assign methods from the service to this class instance
    // This allows the gRPC server to call the methods by their names
    this.addItemToCart = this.addItemToCart.bind(this);
    this.updateItemQuantity = this.updateItemQuantity.bind(this);
    this.removeItemFromCart = this.removeItemFromCart.bind(this);
    this.getCart = this.getCart.bind(this);
  }

  // Method names must be camelCase as per the generated CartServiceServer interface
  async addItemToCart(
    call: grpc.ServerUnaryCall<AddItemToCartRequest, CartResponse>,
    callback: grpc.sendUnaryData<CartResponse>,
  ): Promise<void> {
    try {
      const { userId, productId, quantity } = call.request;
      if (!userId || !productId || !quantity) {
        callback(
          {
            code: grpc.status.INVALID_ARGUMENT,
            message: "Missing required fields",
          },
          null,
        );
        return;
      }

      const cart = await this.cartBusinessService.addItem(
        userId,
        productId,
        quantity,
      );
      const response: CartResponse = {
        cart: {
          userId: cart.userId.toString(), // Convert back to string for proto
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name || "",
            priceCents: item.priceCents || 0,
            imageUrl: item.imageUrl || "",
          })),
        },
      };
      callback(null, response);
    } catch (error: any) {
      console.error("Error in addItemToCart:", error);
      callback({ code: grpc.status.INTERNAL, message: error.message }, null);
    }
  }

  async updateItemQuantity(
    call: grpc.ServerUnaryCall<UpdateItemQuantityRequest, CartResponse>,
    callback: grpc.sendUnaryData<CartResponse>,
  ): Promise<void> {
    try {
      const { userId, productId, quantity } = call.request;
      if (!userId || !productId || !quantity) {
        callback(
          {
            code: grpc.status.INVALID_ARGUMENT,
            message: "Missing required fields",
          },
          null,
        );
        return;
      }
      const cart = await this.cartBusinessService.updateItemQuantity(
        userId,
        productId,
        quantity,
      );
      if (!cart) {
        callback(
          { code: grpc.status.NOT_FOUND, message: "Cart or item not found" },
          null,
        );
        return;
      }
      const response: CartResponse = {
        cart: {
          userId: cart.userId.toString(),
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name || "",
            priceCents: item.priceCents || 0,
            imageUrl: item.imageUrl || "",
          })),
        },
      };
      callback(null, response);
    } catch (error: any) {
      console.error("Error in updateItemQuantity:", error);
      callback({ code: grpc.status.INTERNAL, message: error.message }, null);
    }
  }

  async removeItemFromCart(
    call: grpc.ServerUnaryCall<RemoveItemFromCartRequest, CartResponse>,
    callback: grpc.sendUnaryData<CartResponse>,
  ): Promise<void> {
    try {
      const { userId, productId } = call.request;
      if (!userId || !productId) {
        callback(
          {
            code: grpc.status.INVALID_ARGUMENT,
            message: "Missing required fields",
          },
          null,
        );
        return;
      }
      const cart = await this.cartBusinessService.removeItem(userId, productId);
      if (!cart) {
        callback(
          { code: grpc.status.NOT_FOUND, message: "Cart or item not found" },
          null,
        );
        return;
      }
      const response: CartResponse = {
        cart: {
          userId: cart.userId.toString(),
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name || "",
            priceCents: item.priceCents || 0,
            imageUrl: item.imageUrl || "",
          })),
        },
      };
      callback(null, response);
    } catch (error: any) {
      console.error("Error in removeItemFromCart:", error);
      callback({ code: grpc.status.INTERNAL, message: error.message }, null);
    }
  }

  async getCart(
    call: grpc.ServerUnaryCall<GetCartRequest, CartResponse>,
    callback: grpc.sendUnaryData<CartResponse>,
  ): Promise<void> {
    try {
      const { userId } = call.request;
      if (!userId) {
        callback(
          { code: grpc.status.INVALID_ARGUMENT, message: "Missing userId" },
          null,
        );
        return;
      }
      const cartDetails = await this.cartBusinessService.getCart(userId);
      if (!cartDetails) {
        callback(
          { code: grpc.status.NOT_FOUND, message: "Cart not found" },
          null,
        );
        return;
      }
      const response: CartResponse = {
        cart: {
          userId: cartDetails.userId.toString(),
          items: cartDetails.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            name: item.name || "",
            priceCents: item.priceCents || 0,
            imageUrl: item.imageUrl || "",
          })),
        },
      };
      callback(null, response);
    } catch (error: any) {
      console.error("Error in getCart:", error);
      callback({ code: grpc.status.INTERNAL, message: error.message }, null);
    }
  }
}

export function startGrpcServer(
  cartBusinessService: CartBusinessService,
  port: string,
): Server {
  const server = new grpc.Server();
  server.addService(
    CartServiceService,
    new CartGrpcService(
      cartBusinessService,
    ) as unknown as UntypedServiceImplementation,
  ); // Cast here

  server.bindAsync(
    `0.0.0.0:${port}`,
    ServerCredentials.createInsecure(),
    (err: Error | null, bindPort: number) => {
      if (err) {
        console.error(`Error binding gRPC server: ${err.message}`);
        return;
      }
      server.start();
      console.log(`gRPC server listening on port ${bindPort}`);
    },
  );
  return server;
}
