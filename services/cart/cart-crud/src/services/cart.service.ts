import type { Cart, CartDetails, CartItem } from "../models/cart.js";
import type { ICartRepository } from "../repositories/ICartRepository.js";
import { ProductReadGrpcClient } from "../grpc/clients/product-read.client.js";
import { InventoryReadGrpcClient } from "../grpc/clients/inventory-read.client.js";
import axios, { type AxiosInstance } from "axios"; // Import axios and AxiosInstance type
import config from "../config/index.js"; // Import config

export class CartService {
  private axiosInstance: AxiosInstance; // Declare a private property for the axios instance

  constructor(
    private cartRepository: ICartRepository,
    private productReadGrpcClient: ProductReadGrpcClient,
    private inventoryReadGrpcClient: InventoryReadGrpcClient,
    axiosInstance?: AxiosInstance, // Make it optional
  ) {
    this.axiosInstance = axiosInstance || axios; // Use provided instance or default axios
  }

  async getOrCreateCart(userId: string): Promise<Cart> {
    const existingCart = await this.cartRepository.findByUserId(userId);
    if (existingCart) {
      return existingCart;
    }

    return this.cartRepository.createCart(userId);
  }

  async addItem(
    userId: string,
    productId: string, // Changed to string to match product.proto
    quantity: number,
  ): Promise<Cart> {
    if (quantity <= 0) {
      throw new Error("Quantity must be positive.");
    }

    // 1. Get product details via gRPC
    const product =
      await this.productReadGrpcClient.getProductDetails(productId);
    if (!product || !product.id) {
      throw new Error("Product not found.");
    }

    // 2. Check stock via gRPC
    const stockResponse = await this.inventoryReadGrpcClient.checkStock(
      productId,
      quantity,
    );
    if (!stockResponse.available) {
      throw new Error(
        stockResponse.message ||
          "Product not available in sufficient quantity.",
      );
    }

    // 3. Enrich CartItem with denormalized product data
    const itemToAdd: CartItem = {
      productId: product.id,
      quantity: quantity,
      name: product.name || "",
      priceCents: Math.round(product.price * 100), // Convert double price to cents
      imageUrl: product.imageUrl || "",
    };

    const cart = await this.getOrCreateCart(userId);
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === itemToAdd.productId,
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex]!.quantity += quantity;
    } else {
      cart.items.push(itemToAdd);
    }
    cart.updatedAt = new Date();
    return this.cartRepository.save(cart);
  }

  async getCart(userId: string): Promise<CartDetails | null> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return null;
    }

    // Since CartItem now contains denormalized product data, we don't need to call product service here.
    const enrichedItems = cart.items;

    // Calculate subtotal
    let subtotalCents = enrichedItems.reduce((total, item) => {
      if (item.priceCents) {
        return total + item.priceCents * item.quantity;
      }
      return total;
    }, 0);

    let totalDiscountCents = 0;
    let totalTaxCents = 0;

    try {
      // Call Discount Engine
      const discountResponse = await this.axiosInstance.post(
        `${config.discountEngineUrl}/calculate-discounts`,
        { items: enrichedItems, userId: userId },
      );
      totalDiscountCents = discountResponse.data.total_discount_cents || 0;
    } catch (error) {
      console.error("Error calling discount engine:", error);
      // Proceed without discount if service is unavailable
    }

    try {
      // Call Tax Calculation Service
      // For now, providing a mock address, a real implementation would have address details
      const taxResponse = await this.axiosInstance.post(
        `${config.taxCalculationUrl}/calculate-tax`,
        {
          items: enrichedItems,
          userId: userId,
          address: { country: "US", zip: "90210" },
        },
      );
      totalTaxCents = taxResponse.data.tax_cents || 0;
    } catch (error) {
      console.error("Error calling tax calculation service:", error);
      // Proceed without tax if service is unavailable
    }

    const finalTotalCents = subtotalCents - totalDiscountCents + totalTaxCents;

    const cartDetails: CartDetails = {
      id: cart.id, // Ensure all fields are present from Cart
      userId: cart.userId,
      items: enrichedItems,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      totalPriceCents: finalTotalCents, // totalPrice in cents
      subtotalCents: subtotalCents,
      totalDiscountCents: totalDiscountCents,
      totalTaxCents: totalTaxCents,
    };

    return cartDetails;
  }

  async updateItemQuantity(
    userId: string,
    productId: string, // Changed to string
    quantity: number,
  ): Promise<Cart> {
    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    // Inventory check for update quantity
    const stockResponse = await this.inventoryReadGrpcClient.checkStock(
      productId,
      quantity,
    );
    if (!stockResponse.available) {
      throw new Error(
        stockResponse.message ||
          "Product not available in sufficient quantity.",
      );
    }

    const cart = await this.getOrCreateCart(userId);
    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex === -1) {
      throw new Error("Item not found in cart.");
    }
    cart.items[itemIndex]!.quantity = quantity;
    cart.updatedAt = new Date();
    return this.cartRepository.save(cart);
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    // Changed to string
    const cart = await this.getOrCreateCart(userId);
    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId !== productId);

    if (cart.items.length === initialLength) {
      throw new Error("Item not found in cart.");
    }
    cart.updatedAt = new Date();
    return this.cartRepository.save(cart);
  }

  async clearCartByUserId(userId: string): Promise<void> {
    // Assuming cartRepository.findByUserId expects a string (UUID)
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      console.warn(`No active cart found for user ID: ${userId} to clear.`);
      return;
    }
    cart.items = [];
    cart.updatedAt = new Date();
    await this.cartRepository.save(cart);
  }
}
