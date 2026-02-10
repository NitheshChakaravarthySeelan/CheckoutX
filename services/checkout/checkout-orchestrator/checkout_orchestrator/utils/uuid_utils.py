# services/checkout/checkout-orchestrator/checkout_orchestrator/utils/uuid.utils.py
import uuid

def is_valid_uuid(uuid_string: str) -> bool:
    try:
        uuid.UUID(uuid_string, version=4)
        return True
    except ValueError:
        return False
