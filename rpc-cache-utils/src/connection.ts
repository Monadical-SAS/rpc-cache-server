import { Connection } from "@solana/web3.js";
import { getRedisClient, RedisClientUser } from "./redisClient";
import dotenv from "dotenv";

dotenv.config();

console.log("creating connection");
export const connection = new Connection(
  "https://solana-api.projectserum.com/",
  "recent"
);
export const redisReadClient = getRedisClient(RedisClientUser.Reader);
export const redisWriteClient = getRedisClient(RedisClientUser.Writer);
