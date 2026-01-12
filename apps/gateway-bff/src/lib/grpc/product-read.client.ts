import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import {
  ProductReadServiceClient,
  ProductReadServiceService,
  GetAllProductsRequest,
  GetAllProductsResponse,
} from "@proto/product_read_service";
import { Product } from "@proto/product";
import { makeGenericClientConstructor } from "@grpc/grpc-js"; // Import makeGenericClientConstructor

const PROTO_PATH = "../../shared/proto/product_read_service.proto";

export class ProductReadGrpcClient {
  private client: ProductReadServiceClient;

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
      ProductReadServiceService,
      "product_read.ProductReadService",
    ))(
      address,
      grpc.credentials.createInsecure(),
    ) as unknown as ProductReadServiceClient;
  }

  async getProductDetails(
    productId: string,
    metadata?: grpc.Metadata,
  ): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      this.client.getProductDetails(
        { productId },
        metadata || new grpc.Metadata(),
        (error: grpc.ServiceError | null, response: Product) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        },
      );
    });
  }

  async getAllProducts(
    request: GetAllProductsRequest,
    metadata?: grpc.Metadata,
  ): Promise<GetAllProductsResponse> {
    return new Promise((resolve, reject) => {
      this.client.getAllProducts(
        request,
        metadata || new grpc.Metadata(),
        (error: grpc.ServiceError | null, response: GetAllProductsResponse) => {
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
