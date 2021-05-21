#!/bin/bash
# Compile TypeScript
echo "Compiling TypeScript..."
tsc

# Build and deploy Reader function along with API Gateway endpoint using AWS SAM CLI
echo "Building Reader image..."
docker build --build-arg port=$READER_PORT -t rpc-cache-reader -f rpc-cache-reader/Dockerfile .

# Build and deploy Writer Docker image to ECS
echo "Building Writer image..."
docker build --build-arg port=$READER_PORT -t rpc-cache-writer -f rpc-cache-writer/Dockerfile .;
