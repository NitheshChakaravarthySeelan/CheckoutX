import grpc
import os
import cart_pb2
import cart_pb2_grpc
from typing import Dict, Any

class CartClient:
    def __init__(self):
        # The cart-crud service will run on its own port.
        self.host = os.getenv("CART_CRUD_HOST", "localhost")
        self.port = os.getenv("CART_CRUD_PORT", "3001") # <-- IMPORTANT: Verify this port
        
        self.channel = grpc.aio.insecure_channel(f'{self.host}:{self.port}')
        self.stub = cart_pb2_grpc.CartServiceStub(self.channel)

    def _convert_cart_to_dict(self, cart_proto: cart_pb2.Cart) -> Dict[str, Any]:
        """Converts a Cart protobuf message to a dictionary."""
        return {
            "user_id": cart_proto.user_id,
            "items": [{"product_id": item.product_id, "quantity": item.quantity} for item in cart_proto.items]
        }

    async def add_item_to_cart(self, user_id: str, product_id: str, quantity: int) -> Dict[str, Any]:
        request = cart_pb2.AddItemToCartRequest(user_id=user_id, product_id=product_id, quantity=quantity)
        try:
            response = await self.stub.AddItemToCart(request)
            return self._convert_cart_to_dict(response.cart)
        except grpc.aio.AioRpcError as e:
            print(f"Error calling CartService.AddItemToCart: {e}")
            raise

    async def update_item_quantity(self, user_id: str, product_id: str, quantity: int) -> Dict[str, Any]:
        request = cart_pb2.UpdateItemQuantityRequest(user_id=user_id, product_id=product_id, quantity=quantity)
        try:
            response = await self.stub.UpdateItemQuantity(request)
            return self._convert_cart_to_dict(response.cart)
        except grpc.aio.AioRpcError as e:
            print(f"Error calling CartService.UpdateItemQuantity: {e}")
            raise

    async def remove_item_from_cart(self, user_id: str, product_id: str) -> Dict[str, Any]:
        request = cart_pb2.RemoveItemFromCartRequest(user_id=user_id, product_id=product_id)
        try:
            response = await self.stub.RemoveItemFromCart(request)
            return self._convert_cart_to_dict(response.cart)
        except grpc.aio.AioRpcError as e:
            print(f"Error calling CartService.RemoveItemFromCart: {e}")
            raise

    async def get_cart(self, user_id: str) -> Dict[str, Any]:
        request = cart_pb2.GetCartRequest(user_id=user_id)
        try:
            response = await self.stub.GetCart(request)
            return self._convert_cart_to_dict(response.cart)
        except grpc.aio.AioRpcError as e:
            print(f"Error calling CartService.GetCart: {e}")
            raise

# Instantiate the client as a singleton
cart_client = CartClient()
