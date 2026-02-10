import sys
import os

# Add the parent directory of checkout_orchestrator to sys.path
# This mimics how uvicorn might set up the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'checkout_orchestrator')))


print("sys.path:", sys.path)

try:
    from checkout_orchestrator.utils.uuid.utils import is_valid_uuid
    print("Successfully imported is_valid_uuid")
except ModuleNotFoundError as e:
    print(f"ModuleNotFoundError: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
