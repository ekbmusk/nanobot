# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npx vite build --outDir dist

# Stage 2: Python app
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libjpeg62-turbo-dev libfreetype6-dev && \
    rm -rf /var/lib/apt/lists/*

COPY bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot/ .
COPY --from=frontend /frontend/dist/ ./webapp/

EXPOSE 8080
CMD ["python", "main.py"]
