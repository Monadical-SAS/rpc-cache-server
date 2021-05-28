docker build --build-arg port=$READER_PORT -t rpc-cache-reader -f rpc-cache-reader/Dockerfile .
docker tag rpc-cache-reader:latest $READER_CONTAINER_IMAGE_REPO_URL
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $READER_CONTAINER_IMAGE_REPO_URL
docker push $READER_CONTAINER_IMAGE_REPO_URL
