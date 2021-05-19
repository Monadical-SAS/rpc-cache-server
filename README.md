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

## Running the service

### Running locally

### Deploying to the cloud