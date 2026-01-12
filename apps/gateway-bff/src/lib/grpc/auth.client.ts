import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { AuthServiceClient, AuthServiceService } from "@proto/auth_service"; // Use generated client and service
import { makeGenericClientConstructor } from "@grpc/grpc-js"; // Import makeGenericClientConstructor

const PROTO_PATH = "../../shared/proto/auth_service.proto";

export class AuthGrpcClient {
  private client: AuthServiceClient;

  constructor(address: string) {
    // Note: packageDefinition is still needed for protoLoader.loadSync, but not for client instantiation directly
    protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    this.client = new (makeGenericClientConstructor(
      AuthServiceService,
      "auth_service.AuthService",
    ))(
      address,
      grpc.credentials.createInsecure(), // Use insecure for development, secure for production
    ) as unknown as AuthServiceClient;
  }

  async validateToken(
    token: string,
  ): Promise<{
    isValid: boolean;
    userId: string;
    userName: string;
    roles: string[];
  }> {
    return new Promise((resolve, reject) => {
      this.client.validateToken(
        { token },
        (
          error: grpc.ServiceError | null,
          response: {
            isValid: boolean;
            userId: string;
            userName: string;
            roles: string[];
          },
        ) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }
}
