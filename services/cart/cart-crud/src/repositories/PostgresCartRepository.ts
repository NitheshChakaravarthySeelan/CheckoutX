import type { ICartRepository } from "./ICartRepository.js";
import type { Cart, CartItem } from "../models/cart.js";
import { Pool } from "pg";

export class PostgresCartRepository implements ICartRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    });
  }

  async findByUserId(userId: number): Promise<Cart | null> {
    const result = await this.pool.query(
      "SELECT * FROM carts WHERE user_id = $1",
      [userId],
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        items: row.items,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
    return null;
  }

  async createCart(userId: number): Promise<Cart> {
    const result = await this.pool.query(
      "INSERT INTO carts (user_id) VALUES ($1) RETURNING *",
      [userId],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      items: row.items,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateCart(cart: Cart): Promise<Cart> {
    const result = await this.pool.query(
      "UPDATE carts SET items = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [cart.items, cart.id],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      items: row.items,
      createdAt: row.created_at,
      updatedAt: row.updatedAt,
    };
  }

  async save(cart: Cart): Promise<Cart> {
    return this.updateCart(cart);
  }

  async deleteCart(userId: number): Promise<void> {
    await this.pool.query("DELETE FROM carts WHERE user_id = $1", [userId]);
  }

  async addItemToCart(userId: number, item: CartItem): Promise<Cart> {
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
    userId: number,
    productId: number,
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
    userId: number,
    productId: number,
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
