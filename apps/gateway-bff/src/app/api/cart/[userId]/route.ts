import { NextResponse, type NextRequest } from "next/server";
// import { proxy } from "@/lib/httpResponse"; // No longer needed for gRPC calls
import { CartGrpcClient } from "@/lib/grpc/cart.client";
import * as grpc from "@grpc/grpc-js"; // Import grpc

// Instantiate CartGrpcClient
const cartGrpcClient = new CartGrpcClient(
  process.env.CART_GRPC_URL || "localhost:50050",
);

// GET /api/cart/[userId]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { userId } = awaitedParams;
    const xUserId = request.headers.get("X-User-ID");
    const xUserName = request.headers.get("X-User-Name");
    const xUserRoles = request.headers.get("X-User-Roles");

    const metadata = new grpc.Metadata();
    if (xUserId) metadata.add("x-user-id", xUserId);
    if (xUserName) metadata.add("x-user-name", xUserName);
    if (xUserRoles) metadata.add("x-user-roles", xUserRoles);

    const response = await cartGrpcClient.getCart(userId, metadata); // Pass metadata

    if (!response || !response.cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }
    return NextResponse.json(response.cart);
  } catch (error: Error | unknown) {
    console.error("Cart gRPC error (GET):", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}

// POST /api/cart/[userId]/items
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { userId } = awaitedParams;
    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Product ID and quantity are required" },
        { status: 400 },
      );
    }

    const xUserId = request.headers.get("X-User-ID");
    const xUserName = request.headers.get("X-User-Name");
    const xUserRoles = request.headers.get("X-User-Roles");

    const metadata = new grpc.Metadata();
    if (xUserId) metadata.add("x-user-id", xUserId);
    if (xUserName) metadata.add("x-user-name", xUserName);
    if (xUserRoles) metadata.add("x-user-roles", xUserRoles);

    const response = await cartGrpcClient.addItemToCart(
      userId,
      productId,
      quantity,
      metadata,
    ); // Pass metadata

    if (!response || !response.cart) {
      return NextResponse.json(
        { message: "Failed to add item to cart" },
        { status: 500 },
      );
    }
    return NextResponse.json(response.cart, { status: 201 });
  } catch (error: Error | unknown) {
    console.error("Cart gRPC error (POST):", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
