import { Router } from "express";
import { CartService } from "../services/cart.service.js";
import { z } from "zod";
import { validate } from "../utils/validator.js";
import { isValidUuid } from "../utils/uuid.utils.js"; // Import isValidUuid

export function createCartRoutes(cartService: CartService): Router {
  const router = Router();

  const cartItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  });

  // Get cart by user ID
  router.get("/:userId", async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId || !isValidUuid(userId)) {
        return res.status(400).json({ message: "Valid User ID is required" });
      }
      const cart = await cartService.getCart(userId); // Removed Number() casting
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
        const userId = req.params.userId;
        const { productId, quantity } = req.body; // Destructure productId from body

        if (!userId || !isValidUuid(userId)) {
          return res.status(400).json({ message: "Valid User ID is required" });
        }
        if (!productId || !isValidUuid(productId)) {
          return res
            .status(400)
            .json({ message: "Valid Product ID is required" });
        }

        const updatedCart = await cartService.addItem(
          userId, // Removed Number() casting
          productId,
          quantity,
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
        const userId = req.params.userId;
        const productId = req.params.productId;
        const { quantity } = req.body;

        if (!userId || !isValidUuid(userId)) {
          return res.status(400).json({ message: "Valid User ID is required" });
        }
        if (!productId || !isValidUuid(productId)) {
          return res
            .status(400)
            .json({ message: "Valid Product ID is required" });
        }

        const updatedCart = await cartService.updateItemQuantity(
          userId, // Removed Number() casting
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
      const userId = req.params.userId;
      const productId = req.params.productId;

      if (!userId || !isValidUuid(userId)) {
        return res.status(400).json({ message: "Valid User ID is required" });
      }
      if (!productId || !isValidUuid(productId)) {
        return res
          .status(400)
          .json({ message: "Valid Product ID is required" });
      }

      const updatedCart = await cartService.removeItem(
        userId, // Removed Number() casting
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
