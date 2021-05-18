#!/bin/bash
tsc

# Build and deploy Reader function along with API Gateway endpoint using AWS SAM CLI
cd rpc-cache-reader;
sudo sam build;
sudo sam deploy --guided;

# Build and deploy Writer Docker image to ECS
cd ..;
sudo docker build -t rpc-cache-writer -f rpc-cache-writer/Dockerfile .;
# TODO: Change the following to use the user's AWS ID instead of ours
sudo aws ecr get-login-password --region us-east-2 | sudo docker login --username AWS --password-stdin 786003381753.dkr.ecr.us-east-2.amazonaws.com
sudo docker push 786003381753.dkr.ecr.us-east-2.amazonaws.com/rpc-cache-writer
# (Put stuff here for CloudFormation deployment)
