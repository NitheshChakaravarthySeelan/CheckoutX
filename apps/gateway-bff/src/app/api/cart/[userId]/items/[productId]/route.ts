import { NextResponse, type NextRequest } from "next/server";
// import { proxy } from "@/lib/httpResponse"; // No longer needed for gRPC calls
import { CartGrpcClient } from "@/lib/grpc/cart.client";
import * as grpc from "@grpc/grpc-js"; // Import grpc

// Instantiate CartGrpcClient
const cartGrpcClient = new CartGrpcClient(
  process.env.CART_GRPC_URL || "localhost:50050",
);

// PUT /api/cart/[userId]/items/[productId]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string; productId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { userId, productId } = awaitedParams;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity) {
      return NextResponse.json(
        { error: "Quantity is required" },
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

    const response = await cartGrpcClient.updateItemQuantity(
      userId,
      productId,
      quantity,
      metadata,
    ); // Pass metadata

    if (!response || !response.cart) {
      return NextResponse.json(
        { message: "Failed to update item quantity in cart" },
        { status: 500 },
      );
    }
    return NextResponse.json(response.cart);
  } catch (error: Error | unknown) {
    console.error("Cart gRPC error (PUT):", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/cart/[userId]/items/[productId]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string; productId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { userId, productId } = awaitedParams;
    const xUserId = request.headers.get("X-User-ID");
    const xUserName = request.headers.get("X-User-Name");
    const xUserRoles = request.headers.get("X-User-Roles");

    const metadata = new grpc.Metadata();
    if (xUserId) metadata.add("x-user-id", xUserId);
    if (xUserName) metadata.add("x-user-name", xUserName);
    if (xUserRoles) metadata.add("x-user-roles", xUserRoles);

    const response = await cartGrpcClient.removeItemFromCart(
      userId,
      productId,
      metadata,
    ); // Pass metadata

    if (!response || !response.cart) {
      return NextResponse.json(
        { message: "Failed to remove item from cart" },
        { status: 500 },
      );
    }
    return NextResponse.json(response.cart);
  } catch (error: Error | unknown) {
    console.error("Cart gRPC error (DELETE):", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
