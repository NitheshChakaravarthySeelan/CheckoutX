import { NextResponse, type NextRequest } from "next/server";
import { AuthGrpcClient } from "./lib/grpc/auth.client"; // Import AuthGrpcClient

export const config = {
  matcher: ["/api/products/:path*", "/api/orders/:path*"],
};

// Instantiate AuthGrpcClient
const authGrpcClient = new AuthGrpcClient(
  process.env.AUTH_SERVICE_GRPC_URL || "localhost:50051",
);

export async function middleware(request: NextRequest) {
  const jwtToken = request.cookies.get("jwtToken")?.value;

  if (!jwtToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const validationResult = await authGrpcClient.validateToken(jwtToken);

    if (!validationResult.isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newHeader = new Headers(request.headers);
    newHeader.set("X-User-ID", validationResult.userId);
    newHeader.set("X-User-Name", validationResult.userName);
    newHeader.set("X-User-Roles", validationResult.roles.join(","));
    return NextResponse.next({
      request: {
        headers: newHeader,
      },
    });
  } catch (error) {
    console.error("Authentication gRPC error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
