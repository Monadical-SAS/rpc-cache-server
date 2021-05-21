# RPC Cache Server

## What is this for?

### The Issue

Decentralized apps often need to make RPCs to full nodes in order to receive some on-chain information needed for the app. One problem encountered with this is that response times can vary quite a bit with how busy the chain's network is. If the network is busy, this can mean long load times for your users which ends up leading to poor user experience.

### A Solution

One possible solution to this is to cache the information that your app requires in order to cut down on the number of queries to the chain that you have to make. This allows you to not have to depend on how busy the network is while still getting the same required information for your users. In addition, since reading and writing to a cache is such a common usecase, cloud providers have wicked fast cache services that can be deployed all over the world and can often be faster to query than the blockchain even when it's not congested.

This is exactly what this project seeks to do. There are three main components:

1. [Redis](https://redis.io/) instance - this stores the actual results of the RPC calls. Can be either a single Redis instance or a Redis service like [AWS ElastiCache](https://aws.amazon.com/elasticache/).
2. Reader - This actually reads the desired information from the cache and returns it to the client. It should be deployed on a container service that can scale up and down with demand such as [AWS Elastic Container Service](https://aws.amazon.com/ecs/).
3. Writer - This component is responsible for pre-filling the cache before any reader instances come online and updating the values in the cache as they change on-chain. It establishes a WebSocket connection with an RPC server on-chain and gets notified whenever information it has subscribed to changes. It's deployed as a single container and does not need to scale.

Currently, this project is only built to work with the [Solana](https://solana.com/) blockchain. Other blockchains may be supported in the future.

## Configuring for use with your project

Configuration of what gets cached happens in `rpc-cache-utils/src/config.ts`. Here's an example:

```typescript
export const settings = {
  commitment: "recent",
  notSupportedEncoding: ["jsonParsed"],
  cacheFunctions: {
    names: ["getProgramAccounts"],
    params: {
      getProgramAccounts: [
        "WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC",
        "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
      ],
    },
    filters: {
      getProgramAccounts: {
        "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": [
          [
            {
              dataSize: 388,
            },
          ],
        ],
      },
    },
  },
};
```

Explanations for each of the keys:

- `commitment`: the commitment you want to use.
- `notSupportedEncoding`: encodings currently not supported
- `cacheFunctions`:
  - `names`: A list of the [RPC API](https://docs.solana.com/developing/clients/jsonrpc-api) functions that you want to cache values of.
  - `params`: An object where the keys are the names of the functions you want to cache and the values are the parameters that you want to use for those functions.
- `filters`: An object where the keys are the names of the functions you want to cache and the values are objects that contain filters that get passed along with the RPC.

## Running the service

### Running locally

Requirements for usage locally:

- `node` v15 or higher
- `npm` v7 or higher
- Redis v6 or higher
- Docker

Installing:

```bash
cd rpc-cache-server
npm i
```

Create a .env file with the following contents:

```
ENV=local
REDIS_SERVER_PRIMARY_URL=localhost
REDIS_SERVER_READ_URL=localhost
REDIS_SERVER_PORT=6379 #or whatever port you have Redis running on
READER_PORT=3000
WRITER_PORT=3001
READER_CONTAINER_IMAGE_REPO_URL=none
WRITER_CONTAINER_IMAGE_REPO_URL=none

```

Building:

```bash
tsc
```

Then, to run the project, execute:

```bash
node dist/lib/rpc-cache-writer/src/writer.js
node dist/lib/rpc-cache-reader/src/reader.js
```

### Deploying to the AWS cloud

You're going to want to setup some resources in AWS using the following services (**it's very important that all of these resources use the same VPC**):

- Elastic Container Registry
  - A repository for the reader container images
  - A repository for the writer container images
- Elastic Container Service
  - A cluster for your reader service and a cluster for your writer
  - Task definitions for both the reader and the writer
  - Start a task in the writer cluster using the writer task definition
  - Start an autoscaling service in the reader cluster using the reader task definition
- ElastiCache
  - Create a Redis cache cluster. The number of replica nodes you'll choose should depend on how much traffic you expect.

**CloudFormation templates are under development. It's advised that you just wait for those to be finished as they will make deployment to the cloud much easier and straightforward.**

If you want to deploy to the AWS cloud, you'll follow the steps above except for the .env file you'll have

```
ENV=aws
REDIS_SERVER_PRIMARY_URL=[URL for primary node in ElastiCache cluster]
REDIS_SERVER_READ_URL=[URL for read-only operations on ElastiCache cluster]
REDIS_SERVER_PORT=6379 #or whatever port you have Redis running on
READER_PORT=3000
WRITER_PORT=3000
READER_CONTAINER_IMAGE_REPO_URL=[URL for your reader container image repository]
WRITER_CONTAINER_IMAGE_REPO_URL=[URL for your writer container image repository]
```

and instead of running the project you'll build and deploy the Docker images to AWS:

```bash
#Reader
docker build -t rpc-cache-reader -f rpc-cache-reader/Dockerfile .
docker tag rpc-cache-reader:latest [URL for your reader container image repository]
aws ecr get-login-password --region [region you are deploying to here] | sudo docker login --username AWS --password-stdin [URL for your reader container image repository]
docker push [URL for your reader container image repository]

#Writer
docker build -t rpc-cache-writer -f rpc-cache-writer/Dockerfile .
docker tag rpc-cache-writer:latest [URL for your writer container image repository]
aws ecr get-login-password --region [region you are deploying to here] | sudo docker login --username AWS --password-stdin [URL for your writer container image repository]
docker push [URL for your writer container image repository]
```