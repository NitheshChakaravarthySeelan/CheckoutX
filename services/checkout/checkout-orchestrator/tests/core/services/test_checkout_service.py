import pytest
import respx
from httpx import Response
from checkout_orchestrator.core.services.checkout_service import CheckoutService
import uuid # Import uuid

@pytest.mark.asyncio
@respx.mock
async def test_perform_checkout_success():
    # Arrange
    cart_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    product_id_1 = str(uuid.uuid4())

    cart_service_url = "http://localhost:8084"
    inventory_service_url = "http://localhost:8085"
    payment_service_url = "http://localhost:8086"
    order_service_url = "http://localhost:8087"

    # Mock external service calls
    respx.get(f"{cart_service_url}/carts/{cart_id}").mock(
        return_value=Response(200, json={"items": [{"product_id": product_id_1, "quantity": 1}], "total_price": 100})
    )
    respx.get(f"{inventory_service_url}/inventory/{product_id_1}").mock(
        return_value=Response(200, json={"stock": 10})
    )
    respx.post(f"{payment_service_url}/payments").mock(
        return_value=Response(200)
    )
    respx.post(f"{order_service_url}/orders").mock(
        return_value=Response(201, json={"id": str(uuid.uuid4())}) # Order ID should also be a UUID
    )
    respx.delete(f"{cart_service_url}/carts/{cart_id}").mock(
        return_value=Response(204)
    )

    service = CheckoutService()

    # Act
    order = await service.perform_checkout(cart_id, user_id)

    # Assert
    assert "id" in order # Check if 'id' key exists
    assert uuid.UUID(order["id"]) # Check if it's a valid UUID


@pytest.mark.asyncio
@respx.mock
async def test_perform_checkout_insufficient_stock():
    # Arrange
    cart_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    product_id_2 = str(uuid.uuid4())

    cart_service_url = "http://localhost:8084"
    inventory_service_url = "http://localhost:8085"

    respx.get(f"{cart_service_url}/carts/{cart_id}").mock(
        return_value=Response(200, json={"items": [{"product_id": product_id_2, "quantity": 5}]})
    )
    respx.get(f"{inventory_service_url}/inventory/{product_id_2}").mock(
        return_value=Response(200, json={"stock": 4})
    )

    service = CheckoutService()

    # Act & Assert
    with pytest.raises(Exception, match="Not enough stock"):
        await service.perform_checkout(cart_id, user_id)
