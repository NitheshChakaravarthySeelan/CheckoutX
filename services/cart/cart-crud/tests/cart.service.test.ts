import { jest } from "@jest/globals";
import { CartService } from "../src/services/cart.service.js";
import { InMemoryCartRepository } from "../src/repositories/InMemoryCartRepository.js";
import { ProductServiceAdapter } from "../src/adapters/ProductServiceAdapter.js";
import type { Cart, CartItem, CartItemDetails } from "../src/models/cart.js";

describe("CartService", () => {
  let cartService: CartService;
  let mockCartRepository: InMemoryCartRepository;
  let mockProductServiceAdapter: ProductServiceAdapter;

  beforeEach(() => {
    mockCartRepository = new InMemoryCartRepository();
    mockProductServiceAdapter = {
      getProductById: jest.fn(),
    } as unknown as ProductServiceAdapter;
    cartService = new CartService(
      mockCartRepository,
      mockProductServiceAdapter,
    );
  });

  it("should create a cart if one does not exist when adding an item", async () => {
    const userId = 1;
    const item: CartItem = { productId: 1, quantity: 1 };
    (
      mockProductServiceAdapter.getProductById as jest.Mock
    ).mockResolvedValueOnce({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });

    const cart = await cartService.addItem(
      userId,
      item.productId,
      item.quantity,
    );

    expect(cart).toBeDefined();
    expect(cart.userId).toBe(userId);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual(item);
  });

  it("should add a new item to an existing cart", async () => {
    const userId = 1;
    const item1: CartItem = { productId: 1, quantity: 1 };
    const item2: CartItem = { productId: 2, quantity: 2 };
    (
      mockProductServiceAdapter.getProductById as jest.Mock
    ).mockResolvedValueOnce({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });
    (
      mockProductServiceAdapter.getProductById as jest.Mock
    ).mockResolvedValueOnce({
      id: "2",
      name: "Product 2",
      price: 200,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 20,
    });

    await cartService.addItem(userId, item1.productId, item1.quantity);
    const cart = await cartService.addItem(
      userId,
      item2.productId,
      item2.quantity,
    );

    expect(cart.items).toHaveLength(2);
    expect(cart.items[1]).toEqual(item2);
  });

  it("should update quantity if item already exists in cart", async () => {
    const userId = 1;
    const item: CartItem = { productId: 1, quantity: 1 };
    (mockProductServiceAdapter.getProductById as jest.Mock).mockResolvedValue({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });

    await cartService.addItem(userId, item.productId, item.quantity);
    const cart = await cartService.addItem(userId, 1, 2);
    if (cart) {
      expect(cart!.items).toHaveLength(1);
      expect(cart!.items[0].quantity).toBe(3);
    }
  });

  it("should update item quantity for an existing item", async () => {
    const userId = 1;
    const item: CartItem = { productId: 1, quantity: 1 };
    (
      mockProductServiceAdapter.getProductById as jest.Mock
    ).mockResolvedValueOnce({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });

    await cartService.addItem(userId, item.productId, item.quantity);
    const cart = await cartService.updateItemQuantity(userId, 1, 5);
    if (cart) {
      expect(cart!.items[0].quantity).toBe(5);
    }
  });

  it("should remove an item from the cart", async () => {
    const userId = 1;
    const item1: CartItem = { productId: 1, quantity: 1 };
    const item2: CartItem = { productId: 2, quantity: 2 };
    (
      mockProductServiceAdapter.getProductById as jest.Mock
    ).mockResolvedValueOnce({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });
    (
      mockProductServiceAdapter.getProductById as jest.Mock
    ).mockResolvedValueOnce({
      id: "2",
      name: "Product 2",
      price: 200,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 20,
    });

    await cartService.addItem(userId, item1.productId, item1.quantity);
    await cartService.addItem(userId, item2.productId, item2.quantity);
    const cart = await cartService.removeItem(userId, 1);
    if (cart) {
      expect(cart!.items).toHaveLength(1);
      expect(cart!.items[0].productId).toBe(2);
    }
  });

  it("should return a detailed cart with product information and total price", async () => {
    const userId = 1;
    const item1: CartItem = { productId: 1, quantity: 1 };
    const item2: CartItem = { productId: 2, quantity: 2 };

    (mockProductServiceAdapter.getProductById as jest.Mock)
      .mockResolvedValueOnce({
        id: "1",
        name: "Product 1",
        price: 100,
        currency: "USD",
        imageUrl: "url1",
        description: "desc1",
        quantity: 10,
      })
      .mockResolvedValueOnce({
        id: "2",
        name: "Product 2",
        price: 200,
        currency: "USD",
        imageUrl: "url2",
        description: "desc2",
        quantity: 20,
      });

    await cartService.addItem(userId, item1.productId, item1.quantity);
    await cartService.addItem(userId, item2.productId, item2.quantity);

    (mockProductServiceAdapter.getProductById as jest.Mock)
      .mockResolvedValueOnce({
        id: "1",
        name: "Product 1",
        price: 100,
        currency: "USD",
        imageUrl: "url1",
        description: "desc1",
        quantity: 10,
      })
      .mockResolvedValueOnce({
        id: "2",
        name: "Product 2",
        price: 200,
        currency: "USD",
        imageUrl: "url2",
        description: "desc2",
        quantity: 20,
      });

    const detailedCart = await cartService.getCart(userId);

    expect(detailedCart).toBeDefined();
    if (detailedCart) {
      expect(detailedCart!.items).toHaveLength(2);
      expect(detailedCart!.items[0].name).toBe("Product 1");
      expect(detailedCart!.items[1].price).toBe(200);
      expect(detailedCart!.totalPrice).toBe(500); // 100 * 1 + 200 * 2 = 500
    }
  });

  it("should return null if cart not found for detailed cart request", async () => {
    const userId = 999;
    const detailedCart = await cartService.getCart(userId);
    expect(detailedCart).toBeNull();
  });

  it("should handle product not found when getting detailed cart", async () => {
    const userId = 1;
    const item: CartItem = { productId: 1, quantity: 1 };
    (
      mockProductServiceAdapter.getProductById as jest.Mock
    ).mockResolvedValueOnce(null);

    await expect(
      cartService.addItem(userId, item.productId, item.quantity),
    ).rejects.toThrow("Product not found.");
  });
});
