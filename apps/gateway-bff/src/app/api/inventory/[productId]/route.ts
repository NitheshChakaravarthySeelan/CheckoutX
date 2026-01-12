import { NextResponse, type NextRequest } from "next/server";
// import { proxy } from "@/lib/httpResponse"; // No longer needed
import { InventoryGrpcClient } from "@/lib/grpc/inventory.client";

// Instantiate InventoryGrpcClient
const inventoryGrpcClient = new InventoryGrpcClient(
  process.env.INVENTORY_GRPC_URL || "localhost:50053",
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { productId } = awaitedParams;
    // Assuming a basic stock check for quantity 1 for this GET endpoint
    const quantity = parseInt(
      request.nextUrl.searchParams.get("quantity") || "1",
    );

    const response = await inventoryGrpcClient.checkStock(productId, quantity); // Call gRPC service

    return NextResponse.json(response);
  } catch (error: Error | unknown) {
    console.error("Inventory gRPC error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
