import * as grpc from "@grpc/grpc-js";

// Mock Next.js server utilities
jest.mock("next/server", () => {
  class MockNextResponse {
    public status: number;
    public body: object | null;
    public headers: Headers;

    constructor(
      body: object | null,
      init: { status?: number; headers?: Headers } = {},
    ) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = init.headers || new Headers();
    }

    json = async () => this.body;

    static json(
      body: object | null,
      init: { status?: number; headers?: Headers } = {},
    ) {
      return new MockNextResponse(body, init);
    }

    static next(_init?: { request: { headers: Headers } }) {
      return new MockNextResponse({}, { status: 200 }); // Mock minimal response
    }
  }

  return {
    NextRequest: jest
      .fn()
      .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        // Basic mock for NextRequest
        return {
          headers: new Headers(init?.headers),
          json: async () => JSON.parse(init?.body?.toString() || "{}"), // Assume body is stringified JSON
          url: typeof input === "string" ? input : input.url,
          method: init?.method || "GET",
        };
      }),
    NextResponse: {
      json: jest.fn(
        (
          body: object | null,
          init: { status?: number; headers?: Headers } = {},
        ) => {
          return new MockNextResponse(body, init);
        },
      ),
      next: jest.fn().mockImplementation(() => {
        return new MockNextResponse({}, { status: 200 });
      }),
    },
  };
});

interface MockedHeadersInterface {
  append(name: string, value: string): void;
  get(name: string): string | null;
  set(name: string, value: string): void;
  has(name: string): boolean;
  forEach(
    callbackfn: (value: string, key: string, map: Map<string, string>) => void,
    thisArg?: unknown,
  ): void;
}

// Mock global Headers for consistency, as NextRequest/Response might use them
class MockHeaders extends Map<string, string> {
  constructor(init?: { [key: string]: string } | Headers) {
    super();
    if (init instanceof Headers) {
      init.forEach((value, key) => this.set(key, value));
    } else if (init) {
      for (const key in init) {
        if (Object.prototype.hasOwnProperty.call(init, key)) {
          this.set(key, init[key]);
        }
      }
    }
  }

  append(name: string, value: string) {
    const existing = this.get(name);
    this.set(name, existing ? `${existing}, ${value}` : value);
  }

  get(name: string) {
    return super.get(name.toLowerCase());
  }

  set(name: string, value: string) {
    return super.set(name.toLowerCase(), value);
  }

  has(name: string) {
    return super.has(name.toLowerCase());
  }

  forEach(
    callbackfn: (value: string, key: string, map: Map<string, string>) => void,
    thisArg?: unknown,
  ): void {
    super.forEach(callbackfn, thisArg);
  }
}

global.Headers = MockHeaders as unknown as MockedHeadersInterface; // Global mock for Headers

// Now import the actual route handler after all mocks
import { POST } from "@/app/api/checkout/initiate/route";
import { CartGrpcClient } from "@/lib/grpc/cart.client";
import { publishCheckoutInitiatedEvent } from "@/lib/kafka";

// Mock CartGrpcClient
jest.mock("@/lib/grpc/cart.client", () => ({
  CartGrpcClient: jest.fn().mockImplementation(() => ({
    getCart: jest.fn(),
  })),
}));

// Mock Kafka publish function
jest.mock("@/lib/kafka", () => ({
  publishCheckoutInitiatedEvent: jest.fn(),
}));

// Use the mocked Next.js utilities
import { NextRequest } from "next/server";

const mockGetCart = (CartGrpcClient as jest.Mock).mock.results[0].value.getCart;

describe("API Route: POST /api/checkout/initiate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock behavior for successful cart retrieval
    mockGetCart.mockResolvedValue({
      cart: {
        userId: "test-user-id",
        items: [
          {
            productId: "prod-1",
            quantity: 1,
            name: "Product 1",
            priceCents: 1000,
            imageUrl: "url1",
          },
        ],
        totalPriceCents: 1000,
        totalDiscountCents: 0,
        totalTaxCents: 0,
      },
    });
    // Default mock behavior for successful Kafka publish
    (publishCheckoutInitiatedEvent as jest.Mock).mockResolvedValue(undefined);
  });

  it("should return 202 and send CheckoutInitiatedEvent on valid input", async () => {
    // Create a mock NextRequest
    const mockRequest = new NextRequest("http://localhost/", {
      method: "POST",
      headers: { "X-User-ID": "test-user-id" },
      body: JSON.stringify({}), // Empty body for POST as cart details come from gRPC
    });

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(response.status).toBe(202);
    expect(jsonResponse).toHaveProperty("message", "Checkout initiated");
    expect(jsonResponse).toHaveProperty("saga_id");

    expect(mockGetCart).toHaveBeenCalledWith(
      "test-user-id",
      expect.any(grpc.Metadata),
    );
    expect(publishCheckoutInitiatedEvent).toHaveBeenCalledTimes(1);

    const sentPayload = (publishCheckoutInitiatedEvent as jest.Mock).mock
      .calls[0][0];
    expect(sentPayload).toHaveProperty("saga_id", jsonResponse.saga_id);
    expect(sentPayload).toHaveProperty("user_id", "test-user-id");
    expect(sentPayload).toHaveProperty("cart_id", "test-user-id");
    expect(sentPayload.items).toEqual([
      {
        product_id: "prod-1",
        quantity: 1,
        price_cents: 1000,
        name: "Product 1",
        image_url: "url1",
      },
    ]);
    expect(sentPayload).toHaveProperty("total_price_cents", 1000);
    expect(sentPayload).toHaveProperty("total_discount_cents", 0);
    expect(sentPayload).toHaveProperty("total_tax_cents", 0);
  });

  it("should return 401 if X-User-ID header is missing", async () => {
    const mockRequest = new NextRequest("http://localhost/", {
      method: "POST",
      headers: {},
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(response.status).toBe(401);
    expect(jsonResponse).toHaveProperty(
      "error",
      "Unauthorized: User ID missing",
    );
    expect(mockGetCart).not.toHaveBeenCalled();
    expect(publishCheckoutInitiatedEvent).not.toHaveBeenCalled();
  });

  it("should return 400 if cart is empty or not found", async () => {
    mockGetCart.mockResolvedValueOnce({ cart: { items: [] } }); // Mock empty cart

    const mockRequest = new NextRequest("http://localhost/", {
      method: "POST",
      headers: { "X-User-ID": "test-user-id" },
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse).toHaveProperty("error", "Cart is empty or not found");
    expect(mockGetCart).toHaveBeenCalledTimes(1);
    expect(publishCheckoutInitiatedEvent).not.toHaveBeenCalled();
  });

  it("should return 500 on gRPC cart service error", async () => {
    mockGetCart.mockRejectedValueOnce(new Error("gRPC connection failed"));

    const mockRequest = new NextRequest("http://localhost/", {
      method: "POST",
      headers: { "X-User-ID": "test-user-id" },
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(response.status).toBe(500);
    expect(jsonResponse).toHaveProperty("error", "Failed to initiate checkout");
    expect(mockGetCart).toHaveBeenCalledTimes(1);
    expect(publishCheckoutInitiatedEvent).not.toHaveBeenCalled();
  });

  it("should return 500 on Kafka publish error", async () => {
    (publishCheckoutInitiatedEvent as jest.Mock).mockRejectedValueOnce(
      new Error("Kafka publish failed"),
    );

    const mockRequest = new NextRequest("http://localhost/", {
      method: "POST",
      headers: { "X-User-ID": "test-user-id" },
      body: JSON.stringify({}),
    });

    const response = await POST(mockRequest);
    const jsonResponse = await response.json();

    expect(response.status).toBe(500);
    expect(jsonResponse).toHaveProperty("error", "Failed to initiate checkout");
    expect(mockGetCart).toHaveBeenCalledTimes(1);
    expect(publishCheckoutInitiatedEvent).toHaveBeenCalledTimes(1);
  });
});
