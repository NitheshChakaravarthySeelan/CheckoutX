import { NextResponse, type NextRequest } from "next/server";
import { proxy } from "@/lib/httpResponse"; // Keep proxy for PUT/DELETE for now
import { ProductReadGrpcClient } from "@/lib/grpc/product-read.client";
import * as grpc from "@grpc/grpc-js"; // Import grpc

// Instantiate ProductReadGrpcClient
const productReadGrpcClient = new ProductReadGrpcClient(
  process.env.PRODUCT_READ_GRPC_URL || "localhost:50052",
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { productId } = awaitedParams;
    const userId = request.headers.get("X-User-ID");
    const userName = request.headers.get("X-User-Name");
    const userRoles = request.headers.get("X-User-Roles");

    const metadata = new grpc.Metadata();
    if (userId) metadata.add("x-user-id", userId);
    if (userName) metadata.add("x-user-name", userName);
    if (userRoles) metadata.add("x-user-roles", userRoles);

    const response = await productReadGrpcClient.getProductDetails(
      productId,
      metadata,
    ); // Call gRPC service

    if (!response) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(response);
  } catch (error: Error | unknown) {
    console.error("ProductRead gRPC error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { productId } = awaitedParams;
    const body = await request.json();
    const headers = new Headers(request.headers);
    const userId = headers.get("X-User-ID");
    const userRoles = headers.get("X-User-Roles");

    const option: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "X-User-ID": userId }),
        ...(userRoles && { "X-User-Roles": userRoles }),
      },
      body: JSON.stringify(body),
    };
    const response = await proxy(
      `${process.env.PRODUCT_WRITE_SERVICE_URL}/${productId}`,
      option,
    );
    return response;
  } catch (error: Error | unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const awaitedParams = await context.params;
    const { productId } = awaitedParams;
    const headers = new Headers(request.headers);
    const userId = headers.get("X-User-ID");
    const userRoles = headers.get("X-User-Roles");

    const option: RequestInit = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "X-User-ID": userId }),
        ...(userRoles && { "X-User-Roles": userRoles }),
      },
    };
    const response = await proxy(
      `${process.env.PRODUCT_WRITE_SERVICE_URL}/${productId}`,
      option,
    );
    return response;
  } catch (error: Error | unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}
