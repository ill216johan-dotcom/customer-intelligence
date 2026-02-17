FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (ffmpeg for audio processing)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .

# Install PyTorch CPU version and setuptools (required for whisper)
RUN pip install --no-cache-dir setuptools torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Install other requirements
RUN pip install --no-cache-dir -r requirements.txt

# Install openai-whisper with --no-build-isolation to fix pkg_resources issue
RUN pip install --no-cache-dir --no-build-isolation openai-whisper==20231117

# Copy application code
COPY . .

# Create audio directory
RUN mkdir -p /app/audio

# Environment variables (can be overridden by docker-compose.yml)
ENV WHISPER_MODEL=large-v3
ENV WHISPER_DEVICE=cpu

# Run Celery worker
CMD ["celery", "-A", "tasks.celery_app", "worker", "--loglevel=info", "--concurrency=2"]
