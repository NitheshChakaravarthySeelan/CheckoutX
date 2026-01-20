FROM python:3.12-slim-bookworm as builder

WORKDIR /app

# Set environment variable for requests timeout
ENV REQUESTS_TIMEOUT=120

# Install Poetry
RUN pip install poetry

# Copy project files
COPY pyproject.toml poetry.lock ./

# Generate poetry.lock to align with pyproject.toml changes
RUN poetry lock

# Create and activate virtual environment explicitly
RUN poetry env use python3.12
RUN poetry run pip install --upgrade pip

# Install dependencies into the virtual environment
RUN poetry install --no-root --no-interaction --no-ansi

# Copy application code
COPY . .

FROM python:3.12-slim-bookworm

WORKDIR /app

# Copy the entire /app directory from the builder stage
COPY --from=builder /app /app

# Add .venv to PATH (Poetry usually creates it inside /app if configured)
ENV PATH="/app/.venv/bin:$PATH"

# Expose port (default for FastAPI/Uvicorn)
EXPOSE 8000

# Command to run the application using poetry run
CMD ["poetry", "run", "uvicorn", "checkout_orchestrator.main:app", "--host", "0.0.0.0", "--port", "8000"]