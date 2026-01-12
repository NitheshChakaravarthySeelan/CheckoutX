import { NextResponse, type NextRequest } from "next/server";
import { proxy } from "@/lib/httpResponse";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { productId } = awaitedParams;
    const option = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const response = await proxy(
      `${process.env.LIST_PRICE_SERVICE_URL}/${productId}`,
      option,
    );
    return response;
  } catch (error: Error | unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}
