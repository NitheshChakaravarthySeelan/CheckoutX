import type { ICartRepository } from "./ICartRepository.js";
import type { Cart, CartItem } from "../models/cart.js";

export class InMemoryCartRepository implements ICartRepository {
  private carts: Map<string, Cart> = new Map();
  private nextId = 1;

  async findByUserId(userId: string): Promise<Cart | null> {
    return this.carts.get(userId) || null;
  }

  async createCart(userId: string): Promise<Cart> {
    const newCart: Cart = {
      id: this.nextId++, // id remains number for now, as per init.sql. userId changes to string.
      userId,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.carts.set(userId, newCart);
    return newCart;
  }

  async updateCart(cart: Cart): Promise<Cart> {
    if (this.carts.has(cart.userId)) {
      const updatedCart = { ...cart, updatedAt: new Date() };
      this.carts.set(cart.userId, updatedCart);
      return updatedCart;
    }
    throw new Error("Cart not found for update");
  }

  async save(cart: Cart): Promise<Cart> {
    if (this.carts.has(cart.userId)) {
      const updatedCart = { ...cart, updatedAt: new Date() };
      this.carts.set(cart.userId, updatedCart);
      return updatedCart;
    }
    throw new Error("Cart not found for save");
  }

  async deleteCart(userId: string): Promise<void> {
    this.carts.delete(userId);
  }

  async addItemToCart(userId: string, item: CartItem): Promise<Cart> {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      cart = await this.createCart(userId);
    }

    const existingItemIndex = cart.items.findIndex(
      (i: CartItem) => i.productId === item.productId,
    );
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex]!.quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

    return this.updateCart(cart);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart | null> {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      return null;
    }

    const existingItemIndex = cart.items.findIndex(
      (i: CartItem) => i.productId === productId,
    );
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex]!.quantity = quantity;
      return this.updateCart(cart);
    }
    return null;
  }

  async removeItemFromCart(
    userId: string,
    productId: string,
  ): Promise<Cart | null> {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      return null;
    }

    cart.items = cart.items.filter(
      (item: CartItem) => item.productId !== productId,
    );
    return this.updateCart(cart);
  }
}
