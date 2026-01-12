import { jest } from "@jest/globals";
import request from "supertest";
import { createCartRoutes } from "../../src/routes/cart.routes.js"; // Import the function
import { CartService } from "../../src/services/cart.service.js"; // Use type import
import type { Cart } from "../../src/models/cart.js"; // Use type import
import express from "express"; // Import express

// --- Mocking CartService ---
const mockCartService = {
  getOrCreateCart: jest.fn(),
  addItem: jest.fn(),
  getCart: jest.fn(),
  updateItemQuantity: jest.fn(),
  removeItem: jest.fn(),
} as any; // Cast to any to bypass strict type checking for the mock

describe("Cart API", () => {
  const userId = 123;
  let app: express.Application; // Declare app here

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new express app for each test
    app = express();
    app.use(express.json());

    // Use the createCartRoutes function with our mocked CartService
    app.use("/api/v1/carts", createCartRoutes(mockCartService));
  });

  it("should return a 404 for a non-existent cart", async () => {
    // Arrange: Tell the mock service to return null when getCart is called
    mockCartService.getCart.mockResolvedValue(null);

    // Act
    const res = await request(app).get(`/api/v1/carts/999`);

    // Assert
    expect(res.statusCode).toEqual(404);
    expect(mockCartService.getCart).toHaveBeenCalledWith(999);
  });

  it("should add an item to the cart", async () => {
    // Arrange
    const newItem = { productId: "101", quantity: 1 };
    const expectedCart: Cart = {
      id: 1,
      userId,
      items: [newItem],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCartService.addItem.mockResolvedValue(expectedCart);

    // Act
    const res = await request(app)
      .post(`/api/v1/carts/${userId}/items`)
      .send(newItem);

    // Assert
    expect(res.statusCode).toEqual(201);
    expect(res.body.userId).toEqual(userId);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].productId).toBe("101");
    expect(mockCartService.addItem).toHaveBeenCalledWith(
      userId,
      newItem.productId,
      newItem.quantity,
    );
  });

  it("should update an item quantity", async () => {
    // Arrange
    const update = { productId: "101", quantity: 3 };
    const existingCart: Cart = {
      id: 1,
      userId,
      items: [{ productId: "101", quantity: 1 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedCart: Cart = {
      ...existingCart,
      items: [{ productId: "101", quantity: 3 }],
    };
    mockCartService.updateItemQuantity.mockResolvedValue(updatedCart);

    // Act
    const res = await request(app)
      .put(`/api/v1/carts/${userId}/items/101`)
      .send(update);

    // Assert
    expect(res.statusCode).toEqual(200);
    const item = res.body.items.find((i: any) => i.productId === "101");
    expect(item.quantity).toEqual(3);
    expect(mockCartService.updateItemQuantity).toHaveBeenCalledWith(
      userId,
      "101",
      update.quantity,
    );
  });

  it("should delete an item from the cart", async () => {
    // Arrange
    const existingCart: Cart = {
      id: 1,
      userId,
      items: [{ id: 1, productId: "101", quantity: 1 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedCart: Cart = { ...existingCart, items: [] }; // Empty items array after delete
    mockCartService.removeItem.mockResolvedValue(updatedCart);

    // Act
    const res = await request(app).delete(`/api/v1/carts/${userId}/items/101`);

    // Assert
    expect(res.statusCode).toEqual(200);
    expect(res.body.items.length).toBe(0);
    expect(mockCartService.removeItem).toHaveBeenCalledWith(userId, "101");
  });
});
