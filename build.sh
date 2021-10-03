#!/bin/bash
# Compile TypeScript
echo "Compiling TypeScript..."
tsc

echo "Building Docker Compose images"
sudo docker-compose build --pull