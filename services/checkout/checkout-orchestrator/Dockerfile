FROM python:3.12-slim-bookworm as builder

WORKDIR /app

# Set environment variable for requests timeout
ENV REQUESTS_TIMEOUT=120

# Install Poetry
RUN pip install poetry
RUN pip install poetry-plugin-export
ENV PATH="/root/.local/bin:$PATH"

# Copy project files for poetry to use
COPY ../../services/checkout/checkout-orchestrator/pyproject.toml ./pyproject.toml
COPY ../../services/checkout/checkout-orchestrator/poetry.lock ./poetry.lock

# Generate requirements.txt from poetry.lock
RUN poetry export -f requirements.txt --without-hashes -o requirements.txt

# Copy application code
COPY ../../services/checkout/checkout-orchestrator/checkout_orchestrator ./checkout_orchestrator

FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy only requirements and application code from builder stage
COPY --from=builder /app/requirements.txt ./requirements.txt
COPY --from=builder /app/checkout_orchestrator ./checkout_orchestrator

# Install dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose port (default for FastAPI/Uvicorn)
EXPOSE 8000

# Command to run the application directly
CMD ["uvicorn", "checkout_orchestrator.main:app", "--host", "0.0.0.0", "--port", "8000"]