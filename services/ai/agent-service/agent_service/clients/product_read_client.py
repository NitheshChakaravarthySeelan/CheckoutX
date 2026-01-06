import grpc
import os
import product_read_service_pb2
import product_read_service_pb2_grpc

class ProductReadClient:
    def __init__(self):
        self.host = os.getenv("PRODUCT_READ_HOST", "localhost")
        self.port = os.getenv("PRODUCT_READ_PORT", "8081")
        self.channel = grpc.aio.insecure_channel(f'{self.host}:{self.port}')
        self.client = product_read_service_pb2_grpc.ProductReadServiceStub(self.channel)

    async def search_products(self, query: str) -> list:
        """
        Calls the product read service to search for products by a query string.
        """
        request = product_read_service_pb2.SearchProductsRequest(query = query)
        try:
            response = await self.client.SearchProducts(request)

            products_list = []
            for p in response.products:
                products_list.append({
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "price": p.price
                })
            return products_list

        except grpc.aio.AioRpcError as e:
            print(f"Error calling ProductReadService.SearchProducts: {e}")
            return []
        except Exception as e:
            print(f"An unexpected error occurs {e}")
            return []

product_read_client = ProductReadClient()
