import grpc
import os
import checkout_pb2
import checkout_pb2_grpc

class CheckoutClient:
    def __init__(self):
        self.host = os.getenv("CHECKOUT_ORCHESTRATOR_HOST", "localhost")
        self.port = os.getenv("CHECKOUT_ORCHESTRATOR_PORT", "8000") # <-- IMPORTANT: Verify this port
        self.channel = grpc.aio.insecure_channel(f'{self.host}:{self.port}')
        self.client = checkout_pb2_grpc.CheckoutServiceStub(self.channel)

    async def initiate_checkout(self, user_id: str) -> str:
        """
        Calls the CheckoutService to start an async checkout process.
        Returns the checkout_id (saga ID) or raise an error.
        """
        request = checkout_pb2.InitiateCheckoutRequest(user_id=user_id)
        try:
            response = await self.client.InitiateCheckout(request)
            return response.checkout_id
        except grpc.aio.AioRpcError as e:
            print(f"Error calling checkoutservice.initiatecheckout for user {user_id}: {e}")
            raise
        except Exception as e:
            print(f"An unexpected error occured during initiate_checkout: {e}")
            raise

    async def get_checkout_status(self, checkout_id: str) -> dict:
        """
        Calls the CheckoutService to get the current status of a checkout process.
        Returns a dictionary with status details.
        """
        request = checkout_pb2.GetCheckoutStatusRequest(checkout_id=checkout_id)
        try:
            response = await self.client.GetCheckoutStatus(request)
            return {
                "checkout_id": response.checkout_id,
                "state": checkout_pb2.CheckoutState.Name(response.state),
                "message": response.message
            }
        except grpc.aio.AioRpcError as e:
            print(f"Error calling checkoutservice.initiatecheckout for user {user_id}: {e}")
            raise
        except Exception as e:
            print(f"An unexpected error occured during initiate_checkout: {e}")
            raise

checkout_client = CheckoutClient()
