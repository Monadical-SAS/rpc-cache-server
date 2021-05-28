# TODO: Create image repositories

#Reader
echo "Deploying Reader image to ECR..."
docker tag rpc-cache-reader:latest $READER_CONTAINER_IMAGE_REPO_URL
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $READER_CONTAINER_IMAGE_REPO_URL
docker push $READER_CONTAINER_IMAGE_REPO_URL

#Writer
echo "Deploying Writer image to ECR..."
docker tag rpc-cache-writer:latest $WRITER_CONTAINER_IMAGE_REPO_URL
aws ecr get-login-password --region $WRITER_CONTAINER_IMAGE_REPO_URL | docker login --username AWS --password-stdin $WRITER_CONTAINER_IMAGE_REPO_URL
docker push $WRITER_CONTAINER_IMAGE_REPO_URL

