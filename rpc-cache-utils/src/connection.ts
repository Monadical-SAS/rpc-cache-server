import { Connection } from "@solana/web3.js";
import redis from "redis";
console.log("creating connection");
export const connection = new Connection(
  "https://solana-api.projectserum.com/",
  "recent"
);
export const redisClient = redis.createClient("rediss://rpc-test-cache.yrok7a.ng.0001.use2.cache.amazonaws.com:6379");
