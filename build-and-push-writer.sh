docker build --build-arg port=$WRITER_PORT -t rpc-cache-writer -f rpc-cache-writer/Dockerfile .;
docker tag rpc-cache-writer:latest $WRITER_CONTAINER_IMAGE_REPO_URL
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $WRITER_CONTAINER_IMAGE_REPO_URL
docker push $WRITER_CONTAINER_IMAGE_REPO_URL
