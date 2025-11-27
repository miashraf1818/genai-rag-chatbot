# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for psycopg2, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install CPU-only PyTorch (Saves ~3GB disk space)
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Safety check: Remove torch from requirements.txt if present to avoid re-installing GPU version
RUN sed -i '/torch/d' requirements.txt

# Install heavy dependencies individually with EXACT versions to prevent "No space left on device"
# We install them one by one and clean cache to keep disk usage low.
RUN pip install --no-cache-dir numpy==2.3.4 pandas==2.3.3 scipy==1.16.3
RUN pip install --no-cache-dir scikit-learn==1.7.2
RUN pip install --no-cache-dir transformers==4.57.1 sentence-transformers==5.1.2

# Remove these heavy deps from requirements.txt so pip doesn't try to reinstall/upgrade them
RUN sed -i '/numpy==/d' requirements.txt && \
    sed -i '/pandas==/d' requirements.txt && \
    sed -i '/scipy==/d' requirements.txt && \
    sed -i '/scikit-learn==/d' requirements.txt && \
    sed -i '/transformers==/d' requirements.txt && \
    sed -i '/sentence-transformers==/d' requirements.txt

# Install remaining Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
