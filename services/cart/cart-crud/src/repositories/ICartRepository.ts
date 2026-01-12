import type { Cart, CartItem } from "../models/cart.js";

export interface ICartRepository {
  findByUserId(userId: number): Promise<Cart | null>;
  createCart(userId: number): Promise<Cart>;
  updateCart(cart: Cart): Promise<Cart>;
  save(cart: Cart): Promise<Cart>;
  deleteCart(userId: number): Promise<void>;
  addItemToCart(userId: number, item: CartItem): Promise<Cart>;
  updateItemQuantity(
    userId: number,
    productId: string,
    quantity: number,
  ): Promise<Cart | null>;
  removeItemFromCart(userId: number, productId: string): Promise<Cart | null>;
}
