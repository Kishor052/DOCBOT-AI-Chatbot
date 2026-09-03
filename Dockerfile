# Dockerfile (multi‑stage)
# ---------- Builder stage ----------
FROM python:3.11-slim AS builder
WORKDIR /app
# Install build dependencies (gcc, etc.) if needed – minimal for pure‑Python packages
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
# Install pip-tools for faster caching (optional)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --upgrade pip && pip install -r backend/requirements.txt
# ---------- Runtime stage ----------
FROM python:3.11-slim AS runtime
WORKDIR /app
# Copy only the installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
# Copy application source
COPY . .
# Expose the FastAPI port (default 8000)
EXPOSE 8000
# Environment variables (override via docker‑run or compose)
ENV HOST=0.0.0.0 \
    PORT=8000
# Run the server with uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
