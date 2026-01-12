import { Router } from "express";
import { CartService } from "../services/cart.service.js";
import { z } from "zod";
import { validate } from "../utils/validator.js";

export function createCartRoutes(cartService: CartService): Router {
  const router = Router();

  const cartItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  });

  // Get cart by user ID
  router.get("/:userId", async (req, res, next) => {
    try {
      const userId = req.params.userId; // userId is string now. Convert to number for existing service
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const cart = await cartService.getCart(Number(userId));
      if (cart) {
        res.json(cart);
      } else {
        res.status(404).json({ message: "Cart not found" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Add item to cart
  router.post(
    "/:userId/items",
    validate(cartItemSchema),
    async (req, res, next) => {
      try {
        const userId = req.params.userId; // userId is string now
        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }
        const item = req.body;
        const updatedCart = await cartService.addItem(
          Number(userId), // Convert to number for existing service
          item.productId,
          item.quantity,
        );
        res.status(201).json(updatedCart);
      } catch (error) {
        next(error);
      }
    },
  );

  // Update item quantity in cart
  router.put(
    "/:userId/items/:productId",
    validate(cartItemSchema), // cartItemSchema only validates quantity from body here
    async (req, res, next) => {
      try {
        const userId = req.params.userId; // userId is string
        const productId = req.params.productId; // productId is string
        const { quantity } = req.body;

        if (!userId || !productId) {
          return res
            .status(400)
            .json({ message: "User ID or Product ID is required" });
        }

        const updatedCart = await cartService.updateItemQuantity(
          Number(userId), // Convert to number for existing service
          productId,
          quantity,
        );
        if (updatedCart) {
          res.json(updatedCart);
        } else {
          res.status(404).json({ message: "Cart or item not found" });
        }
      } catch (error) {
        next(error);
      }
    },
  );

  // Remove item from cart
  router.delete("/:userId/items/:productId", async (req, res, next) => {
    try {
      const userId = req.params.userId; // userId is string
      const productId = req.params.productId; // productId is string

      if (!userId || !productId) {
        return res
          .status(400)
          .json({ message: "User ID or Product ID is required" });
      }

      const updatedCart = await cartService.removeItem(
        Number(userId), // Convert to number for existing service
        productId,
      );
      if (updatedCart) {
        res.json(updatedCart);
      } else {
        res.status(404).json({ message: "Cart or item not found" });
      }
    } catch (error) {
      next(error);
    }
  });

  return router;
}
