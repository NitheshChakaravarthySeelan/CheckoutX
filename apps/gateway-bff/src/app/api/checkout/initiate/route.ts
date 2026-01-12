import { NextResponse, type NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import * as grpc from "@grpc/grpc-js"; // Import grpc for metadata
import { CartGrpcClient } from "../../../../lib/grpc/cart.client";
import { publishCheckoutInitiatedEvent } from "../../../../lib/kafka";

// Instantiate CartGrpcClient
const cartGrpcClient = new CartGrpcClient(
  process.env.CART_GRPC_URL || "localhost:50050",
);

export async function POST(request: NextRequest) {
  try {
    const saga_id = uuidv4();
    const userId = request.headers.get("X-User-ID"); // From middleware

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User ID missing" },
        { status: 401 },
      );
    }

    // Pass user context as gRPC metadata when calling cart-crud
    const metadata = new grpc.Metadata();
    const userName = request.headers.get("X-User-Name");
    const userRoles = request.headers.get("X-User-Roles");
    if (userId) metadata.add("x-user-id", userId);
    if (userName) metadata.add("x-user-name", userName);
    if (userRoles) metadata.add("x-user-roles", userRoles);

    // Get cart details via gRPC
    const cartResponse = await cartGrpcClient.getCart(userId, metadata);

    if (
      !cartResponse ||
      !cartResponse.cart ||
      cartResponse.cart.items.length === 0
    ) {
      return NextResponse.json(
        { error: "Cart is empty or not found" },
        { status: 400 },
      );
    }

    const cart = cartResponse.cart;

    // --- Temporary Workaround: Recalculate pricing in gateway-bff ---
    // This is because the Cart proto does not contain totalPriceCents etc.
    // The long-term solution is to update cart.proto to include these fields.
    const calculatedSubtotalCents = cart.items.reduce((total, item) => {
      return total + item.priceCents * item.quantity;
    }, 0);
    // For now, assume no discounts/taxes are calculated directly by gateway-bff for Kafka event
    const calculatedTotalDiscountCents = 0; // Placeholder
    const calculatedTotalTaxCents = 0; // Placeholder
    const calculatedTotalPriceCents =
      calculatedSubtotalCents -
      calculatedTotalDiscountCents +
      calculatedTotalTaxCents;
    // --- End Temporary Workaround ---

    // Construct CheckoutInitiatedEventPayload
    const payload = {
      saga_id: saga_id,
      user_id: userId,
      cart_id: cart.userId, // Using userId as cartId for now, based on cart model
      items: cart.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price_cents: item.priceCents,
        name: item.name,
        image_url: item.imageUrl,
      })),
      total_price_cents: calculatedTotalPriceCents,
      total_discount_cents: calculatedTotalDiscountCents,
      total_tax_cents: calculatedTotalTaxCents,
    };

    await publishCheckoutInitiatedEvent(payload);

    return NextResponse.json(
      { saga_id, message: "Checkout initiated" },
      { status: 202 },
    );
  } catch (error) {
    console.error("Error initiating checkout:", error);
    return NextResponse.json(
      { error: "Failed to initiate checkout" },
      { status: 500 },
    );
  }
}
