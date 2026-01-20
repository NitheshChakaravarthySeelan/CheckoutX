from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from ..schemas.checkout import CheckoutRequest, CheckoutResponse
from ...core.services.checkout_service import CheckoutService
from ...dependencies import get_checkout_service

router = APIRouter()

@router.post("/checkout")
async def checkout(
    request: CheckoutRequest,
) -> dict:
    try:
        # Dummy response for testing
        return {
            "success": True,
            "order_id": "dummy_saga_id",
            "message": "Checkout function called (dependency removed for testing)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))