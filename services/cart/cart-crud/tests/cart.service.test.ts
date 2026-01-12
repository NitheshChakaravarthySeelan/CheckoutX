import { jest } from "@jest/globals";
import { CartService } from "../src/services/cart.service.js";
import { InMemoryCartRepository } from "../src/repositories/InMemoryCartRepository.js";
import { ProductReadGrpcClient } from "../src/grpc/clients/product-read.client.js";
import { InventoryReadGrpcClient } from "../src/grpc/clients/inventory-read.client.js";
import type { Cart, CartItem, CartItemDetails } from "../src/models/cart.js";

describe("CartService", () => {
  let cartService: CartService;
  let mockCartRepository: InMemoryCartRepository;
  let mockProductReadGrpcClient: ProductReadGrpcClient;
  let mockInventoryReadGrpcClient: InventoryReadGrpcClient;

  beforeEach(() => {
    mockCartRepository = new InMemoryCartRepository();
    mockProductReadGrpcClient = {
      getProductDetails: jest.fn(),
    } as unknown as ProductReadGrpcClient;
    mockInventoryReadGrpcClient = {
      checkStock: jest.fn(),
    } as unknown as InventoryReadGrpcClient;
    cartService = new CartService(
      mockCartRepository,
      mockProductReadGrpcClient,
      mockInventoryReadGrpcClient,
    );
  });

  it("should create a cart if one does not exist when adding an item", async () => {
    const userId = 1;
    const item: CartItem = { productId: "1", quantity: 1 };
    (
      mockProductReadGrpcClient.getProductDetails as jest.Mock
    ).mockResolvedValueOnce({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });
    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValueOnce(
      { available: true },
    );

    const cart = await cartService.addItem(
      userId,
      item.productId,
      item.quantity,
    );

    expect(cart).toBeDefined();
    expect(cart.userId).toBe(userId);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]!.productId).toEqual(item.productId);
    expect(cart.items[0]!.quantity).toEqual(item.quantity);
  });

  it("should add a new item to an existing cart", async () => {
    const userId = 1;
    const item1: CartItem = { productId: "1", quantity: 1 };
    const item2: CartItem = { productId: "2", quantity: 2 };
    (
      mockProductReadGrpcClient.getProductDetails as jest.Mock
    ).mockResolvedValueOnce({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });
    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValueOnce(
      { available: true },
    );
    (
      mockProductReadGrpcClient.getProductDetails as jest.Mock
    ).mockResolvedValueOnce({
      id: "2",
      name: "Product 2",
      price: 200,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 20,
    });
    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValueOnce(
      { available: true },
    );

    await cartService.addItem(userId, item1.productId, item1.quantity);
    const cart = await cartService.addItem(
      userId,
      item2.productId,
      item2.quantity,
    );

    expect(cart.items).toHaveLength(2);
    expect(cart.items[1]!.productId).toEqual(item2.productId);
    expect(cart.items[1]!.quantity).toEqual(item2.quantity);
  });

  it("should update quantity if item already exists in cart", async () => {
    const userId = 1;
    const item: CartItem = { productId: "1", quantity: 1 };
    (
      mockProductReadGrpcClient.getProductDetails as jest.Mock
    ).mockResolvedValue({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });
    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValue({
      available: true,
    });

    await cartService.addItem(userId, item.productId, item.quantity);
    const cart = await cartService.addItem(userId, "1", 2);
    if (cart) {
      expect(cart!.items).toHaveLength(1);
      expect(cart!.items[0]!.quantity).toBe(3);
    }
  });

  it("should update item quantity for an existing item", async () => {
    const userId = 1;
    const item: CartItem = { productId: "1", quantity: 1 };
    (
      mockProductReadGrpcClient.getProductDetails as jest.Mock
    ).mockResolvedValueOnce({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });
    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValue({
      available: true,
    });

    await cartService.addItem(userId, item.productId, item.quantity);
    const cart = await cartService.updateItemQuantity(userId, "1", 5);
    if (cart) {
      expect(cart!.items[0]!.quantity).toBe(5);
    }
  });

  it("should remove an item from the cart", async () => {
    const userId = 1;
    const item1: CartItem = { productId: "1", quantity: 1 };
    const item2: CartItem = { productId: "2", quantity: 2 };
    (
      mockProductReadGrpcClient.getProductDetails as jest.Mock
    ).mockResolvedValueOnce({
      id: "1",
      name: "Product 1",
      price: 100,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 10,
    });
    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValueOnce(
      { available: true },
    );
    (
      mockProductReadGrpcClient.getProductDetails as jest.Mock
    ).mockResolvedValueOnce({
      id: "2",
      name: "Product 2",
      price: 200,
      currency: "USD",
      imageUrl: "url",
      description: "desc",
      quantity: 20,
    });
    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValueOnce(
      { available: true },
    );

    await cartService.addItem(userId, item1.productId, item1.quantity);
    await cartService.addItem(userId, item2.productId, item2.quantity);
    const cart = await cartService.removeItem(userId, "1");
    if (cart) {
      expect(cart!.items).toHaveLength(1);
      expect(cart!.items[0]!.productId).toBe("2");
    }
  });

  it("should return a detailed cart with product information and total price", async () => {
    const userId = 1;
    const item1: CartItem = { productId: "1", quantity: 1 };
    const item2: CartItem = { productId: "2", quantity: 2 };

    (mockProductReadGrpcClient.getProductDetails as jest.Mock)
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

    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValue({
      available: true,
    });

    await cartService.addItem(userId, item1.productId, item1.quantity);
    await cartService.addItem(userId, item2.productId, item2.quantity);

    const detailedCart = await cartService.getCart(userId);

    expect(detailedCart).toBeDefined();
    if (detailedCart) {
      expect(detailedCart!.items).toHaveLength(2);
      expect(detailedCart!.items[0].name).toBe("Product 1");
      expect(detailedCart!.items[1].priceCents).toBe(20000);
      expect(detailedCart!.totalPriceCents).toBe(50000); // 10000 * 1 + 20000 * 2 = 50000
    }
  });

  it("should return null if cart not found for detailed cart request", async () => {
    const userId = 999;
    const detailedCart = await cartService.getCart(userId);
    expect(detailedCart).toBeNull();
  });

  it("should handle product not found when getting detailed cart", async () => {
    const userId = 1;
    const item: CartItem = { productId: "1", quantity: 1 };
    (
      mockProductReadGrpcClient.getProductDetails as jest.Mock
    ).mockResolvedValueOnce(null);
    (mockInventoryReadGrpcClient.checkStock as jest.Mock).mockResolvedValueOnce(
      { available: true },
    );

    await expect(
      cartService.addItem(userId, item.productId, item.quantity),
    ).rejects.toThrow("Product not found.");
  });
});
