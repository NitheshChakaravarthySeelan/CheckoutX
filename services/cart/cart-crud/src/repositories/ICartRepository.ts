import type { Cart, CartItem } from "../models/cart.js";

export interface ICartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  createCart(userId: string): Promise<Cart>;
  updateCart(cart: Cart): Promise<Cart>;
  save(cart: Cart): Promise<Cart>;
  deleteCart(userId: string): Promise<void>;
  addItemToCart(userId: string, item: CartItem): Promise<Cart>;
  updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart | null>;
  removeItemFromCart(userId: string, productId: string): Promise<Cart | null>;
}
