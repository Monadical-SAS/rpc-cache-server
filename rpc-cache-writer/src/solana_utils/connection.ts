import {Connection} from "@solana/web3.js";
import redis from "redis";
console.log("creating connection")
export const connection = new Connection("https://solana-api.projectserum.com/", 'recent')
export const redisClient = redis.createClient();
