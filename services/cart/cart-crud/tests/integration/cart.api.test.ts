import { jest } from "@jest/globals";
import request from "supertest";
import { createCartRoutes } from "../../src/routes/cart.routes.js"; // Import the function
import { CartService } from "../../src/services/cart.service.js"; // Use type import
import type { Cart } from "../../src/models/cart.js"; // Use type import
import express from "express"; // Import express

// Create a direct reference to the mock function for axios.post
const mockAxiosPost = jest.fn((url, data) => {
  if (url.includes("/calculate-discounts")) {
    return Promise.resolve({ data: { total_discount_cents: 100 } }); // Mock a 100 cent discount
  }
  if (url.includes("/calculate-tax")) {
    return Promise.resolve({ data: { tax_cents: 50 } }); // Mock a 50 cent tax
  }
  return Promise.reject(new Error("Unknown axios post URL"));
});

// Mock axios globally for this test file, injecting our mockAxiosPost
jest.mock("axios", () => ({
  __esModule: true, // Important for ESM modules
  default: {
    post: mockAxiosPost, // Use our direct reference here
  },
}));

// No need to import axios directly in the test file, as we're not using it to call post.
// If other methods from axios were used, they would need to be mocked here too.

// --- Mocking CartService ---
const mockCartService = {
  getOrCreateCart: jest.fn(),
  addItem: jest.fn(),
  getCart: jest.fn(),
  updateItemQuantity: jest.fn(),
  removeItem: jest.fn(),
} as any; // Cast to any to bypass strict type checking for the mock

describe("Cart API", () => {
  const userId = "42674a96-69aa-431e-839d-47c75dcdc0e7";
  const productId = "07ea8f2b-310e-45ed-ba69-8cd3e3ebaebc";
  let app: express.Application; // Declare app here

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosPost.mockClear(); // Now correctly clears the mock calls

    // The mockImplementation is now done globally, but we might want to override it per-test if needed.
    // For now, we'll keep the global mock and just clear calls.

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
    const res = await request(app).get(`/api/v1/carts/${userId}`);

    // Assert
    expect(res.statusCode).toEqual(404);
    expect(mockCartService.getCart).toHaveBeenCalledWith(userId);
  });

  it("should add an item to the cart", async () => {
    // Arrange
    const newItem = { productId: productId, quantity: 1 };
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
    expect(res.body.items[0].productId).toBe(productId);
    expect(mockCartService.addItem).toHaveBeenCalledWith(
      userId,
      productId,
      newItem.quantity,
    );
  });

  it("should update an item quantity", async () => {
    // Arrange
    const update = { productId: productId, quantity: 3 };
    const existingCart: Cart = {
      id: 1,
      userId,
      items: [{ productId: productId, quantity: 1 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedCart: Cart = {
      ...existingCart,
      items: [{ productId: productId, quantity: 3 }],
    };
    mockCartService.updateItemQuantity.mockResolvedValue(updatedCart);

    // Act
    const res = await request(app)
      .put(`/api/v1/carts/${userId}/items/${productId}`)
      .send(update);

    // Assert
    expect(res.statusCode).toEqual(200);
    const item = res.body.items.find((i: any) => i.productId === productId);
    expect(item.quantity).toEqual(3);
    expect(mockCartService.updateItemQuantity).toHaveBeenCalledWith(
      userId,
      productId,
      update.quantity,
    );
  });

  it("should delete an item from the cart", async () => {
    // Arrange
    const existingCart: Cart = {
      id: 1,
      userId,
      items: [{ id: 1, productId: productId, quantity: 1 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedCart: Cart = { ...existingCart, items: [] }; // Empty items array after delete
    mockCartService.removeItem.mockResolvedValue(updatedCart);

    // Act
    const res = await request(app).delete(
      `/api/v1/carts/${userId}/items/${productId}`,
    );

    // Assert
    expect(res.statusCode).toEqual(200);
    expect(res.body.items.length).toBe(0);
    expect(mockCartService.removeItem).toHaveBeenCalledWith(userId, productId);
  });
});
