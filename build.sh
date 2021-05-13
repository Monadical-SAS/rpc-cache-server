#!/bin/bash
tsc

# Build and deploy Reader function along with API Gateway endpoint using AWS SAM CLI
cd rpc-cache-reader;
sudo sam build;
sudo sam deploy --guided;

# Build and deploy Writer Docker image to ECS
cd ..;
sudo docker build -t rpc-cache-writer -f rpc-cache-writer/Dockerfile .;
# (Put stuff here for CloudFormation deployment)
