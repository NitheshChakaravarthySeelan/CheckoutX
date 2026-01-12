import { NextResponse, type NextRequest } from "next/server";
import { proxy } from "@/lib/httpResponse";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ param: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const userId = awaitedParams.param; // Here 'param' is expected to be userId
    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const response = await proxy(
      `${process.env.CART_SNAPSHOT_SERVICE_URL}/${userId}`,
      option,
    );
    return response;
  } catch (error: Error | unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ param: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const snapshotId = awaitedParams.param; // Here 'param' is expected to be snapshotId
    const option = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
    const response = await proxy(
      `${process.env.CART_SNAPSHOT_SERVICE_URL}/${snapshotId}`,
      option,
    );
    return response;
  } catch (error: Error | unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}
