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

Configuration of what gets cached happens in `rpc-cache-utils/src/config.ts`.
This file is used by the writer to know what should be pre-cached.

Here's an example:

```typescript
export const settings = {
  commitment: "recent",
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
- `cacheFunctions`:
  - `names`: A list of the [RPC API](https://docs.solana.com/developing/clients/jsonrpc-api) functions that you want to cache values of.
  - `params`: An optional object where the keys are the names of the functions you want to cache and the values are the parameters that you want to use for those functions.
- `filters`: An optional object where the keys are the names of the functions you want to cache and the values are objects that contain filters that get passed along with the RPC.

### IMPORTANT NOTE: Connection Proxy

In order for this project to work properly, we had to create a ConnectionProxy async function that is meant to replace any use of the [Connection](https://solana-labs.github.io/solana-web3.js/classes/connection.html) object from [@solana/web3.js](https://github.com/solana-labs/solana-web3.js/). This allows this package to handle connections to a Solana RPC server and our cache service. If the RPC caching service goes down, it will fall back to the Solana RPC server specified.

```typescript
import { ConnectionProxy } from 'rpc-cache-server'

/**
 * Establish a JSON RPC connection and returns a Connection object that
 * forwards the rpc method request to either solanaEndpoint or cacheEndpoint
 * depending on the settings configuration in the cacheEndpoint server
 *
 * @param solanaEndpoint URL to the fullnode JSON RPC endpoint
 * @param cacheEnpoint URL to the the cache reader
 * @param defaultCommitment optional default commitment level used in case there is any error connecting to cacheEndpoint
 * @return {<Promise<Connection>>}
 */
const conn = await ConnectionProxy(
  "<rpcServerUrl>",
  "<CacheServerUrl>",
  "<defaultCommitment>"
)
```

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
AWS_REGION=none
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

For deploying to AWS, it's highly recommended that you use the CloudFormation templates that are available in the `cloudformation` directory. These automate much of the deployment process and save time. To start, you're going to want to have Docker and the AWS CLI installed. Next, follow these steps:

1. Deploy the VPC network all of your AWS resources will live inside of: `aws cloudformation create-stack --stack-name rpc-cache-network --template-body file://cloudformation/network.yml --capabilities CAPABILITY_NAMED_IAM`. Wait for this step to complete before moving onto the next (you can check the status on the CloudFormation Stacks dashboard on the AWS console).
2. Deploy the Redis ElastiCache cluster that will be used for actually caching the RPC results `aws cloudformation create-stack --stack-name redis-cache --template-body file://cloudformation/redis-cache.yml --capabilities CAPABILITY_NAMED_IAM --parameters ParameterKey=StackName,ParameterValue=rpc-cache-network`. Wait for this step to complete before moving onto the next (you can check the status on the CloudFormation Stacks dashboard on the AWS console).
3. Now you're going to need to get the endpoint URLs for the Redis cluster you just created. Go to the description of your ElastiCache cluster (again, on the AWS web console). In the description section you'll see a Primary Endpoint and a Reader Endpoint. Copy the Primary Endpoint value (without the port number) into the `REDIS_SERVER_PRIMARY_URL` field in your `.env` file and the Reader Endpoint value into the `REDIS_SERVER_READ_URL` field. Make sure to include `https://` in the beginning of each value. For example, if the Primary Endpoint listed is `rer1g58c88hy1m0s.c3bjfg.ng.0001.use2.cache.amazonaws.com:6379`, the value you will put in `REDIS_SERVER_PRIMARY_URL` will be `https://rer1g58c88hy1m0s.c3bjfg.ng.0001.use2.cache.amazonaws.com`.
4. Next, create CloudWatch log groups in the AWS console. Under Logs, select "Log Groups" then create 2 new log groups. One should be called `rpc-reader-service` and the other should be called `rpc-writer-service`.
5. Once this is complete, go to the Elastic Container Registry in the AWS console and create 2 new container repositories. One should be called `rpc-cache-reader` and the other should be called `rpc-cache-writer`. Copy the URIs for each into the corresponding fields in the `.env` file.
6. Next, build the Docker images for the reader and writer and push them up to the repositories you just created. This can be accomplished by running the following commands:
   1. `chmod +x build-and-push-writer.sh`
   2. `chmod +x build-and-push-reader.sh`
   3. `sudo sh -ac ' . ./.env; ./build-and-push-writer.sh; ./build-and-push-reader.sh;'`
7. Finally, you can set up the reader and writer services. Do this by running `aws cloudformation create-stack --stack-name rpc-cache-service --template-body file://cloudformation/rpc-cache-service.yml --capabilities CAPABILITY_NAMED_IAM --parameters ParameterKey=StackName,ParameterValue=rpc-cache-network ParameterKey=WriterImageUrl,ParameterValue=URL_TO_LATEST_IMAGE_IN_YOUR_WRITER_REPO_HERE ParameterKey=ReaderServiceName,ParameterValue=rpc-reader-service ParameterKey=WriterServiceName,ParameterValue=rpc-writer-service ParameterKey=ReaderImageUrl,ParameterValue=URL_TO_LATEST_IMAGE_IN_YOUR_READER_REPO_HERE`. Replace the `URL_TO_LATEST_IMAGE_IN_YOUR_WRITER_REPO_HERE` and `URL_TO_LATEST_IMAGE_IN_YOUR_READER_REPO_HERE` with the URLs from step 5 along with `:latest` at the end.
8. Once that stack is completely created (you can check the status on the CloudFormation stacks view on the AWS console), go to your list of load balancers in EC2 (go to the EC2 Dashboard, scroll down in the left sidebar to Load Balancing, then select Load Balancers) and copy the DNS name that's listed. This is the endpoint you will use to get values from the cache.