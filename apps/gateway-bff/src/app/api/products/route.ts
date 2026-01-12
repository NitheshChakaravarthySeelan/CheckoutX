import { NextResponse, type NextRequest } from "next/server";
import { proxy } from "@/lib/httpResponse"; // Keep proxy for POST for now
import { ProductReadGrpcClient } from "@/lib/grpc/product-read.client";
import * as grpc from "@grpc/grpc-js"; // Import grpc

// Instantiate ProductReadGrpcClient
const productReadGrpcClient = new ProductReadGrpcClient(
  process.env.PRODUCT_READ_GRPC_URL || "localhost:50052",
);

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-ID");
    const userName = request.headers.get("X-User-Name");
    const userRoles = request.headers.get("X-User-Roles");

    const metadata = new grpc.Metadata();
    if (userId) metadata.add("x-user-id", userId);
    if (userName) metadata.add("x-user-name", userName);
    if (userRoles) metadata.add("x-user-roles", userRoles);

    // Pass metadata to the gRPC call
    const response = await productReadGrpcClient.getAllProducts({}, metadata); // Call gRPC service

    return NextResponse.json(response.products); // Assuming response contains a 'products' array
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = new Headers(request.headers);
    // Forward X-User-ID and X-User-Roles from incoming request to backend
    // These headers would typically be set by a middleware or authentication system upstream
    // For local testing, they might be manually added or handled by a development proxy
    const userId = headers.get("X-User-ID");
    const userRoles = headers.get("X-User-Roles");

    const option: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "X-User-ID": userId }),
        ...(userRoles && { "X-User-Roles": userRoles }),
      },
      body: JSON.stringify(body),
    };
    const response = await proxy(
      `${process.env.PRODUCT_WRITE_SERVICE_URL}`,
      option,
    );
    return response;
  } catch (error: Error | unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}
