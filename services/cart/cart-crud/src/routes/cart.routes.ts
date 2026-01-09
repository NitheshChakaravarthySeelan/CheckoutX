import { Router } from "express";
import { CartService } from "../services/cart.service.js";
import { z } from "zod";
import { validate } from "../utils/validator.js";

export function createCartRoutes(cartService: CartService): Router {
  const router = Router();

  const cartItemSchema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  });

  // Get cart by user ID
  router.get("/:userId", async (req, res, next) => {
    try {
      const userId = req.params.userId ? parseInt(req.params.userId) : NaN;
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid User ID" });
      }
      const cart = await cartService.getCart(userId);
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
        const userId = req.params.userId ? parseInt(req.params.userId) : NaN;
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid User ID" });
        }
        const item = req.body;
        const updatedCart = await cartService.addItem(
          userId,
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
    validate(cartItemSchema),
    async (req, res, next) => {
      try {
        const userId = req.params.userId ? parseInt(req.params.userId) : NaN;
        const productId = req.params.productId
          ? parseInt(req.params.productId)
          : NaN;
        const { quantity } = req.body;

        if (isNaN(userId) || isNaN(productId)) {
          return res
            .status(400)
            .json({ message: "Invalid User ID or Product ID" });
        }

        const updatedCart = await cartService.updateItemQuantity(
          userId,
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
      const userId = req.params.userId ? parseInt(req.params.userId) : NaN;
      const productId = req.params.productId
        ? parseInt(req.params.productId)
        : NaN;

      if (isNaN(userId) || isNaN(productId)) {
        return res
          .status(400)
          .json({ message: "Invalid User ID or Product ID" });
      }

      const updatedCart = await cartService.removeItem(userId, productId);
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
