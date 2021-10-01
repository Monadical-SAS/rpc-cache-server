import express, { response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import redis from "redis";
import { JSONRPCParams, JSONRPCResponse } from "json-rpc-2.0";
import axios from "axios";
import { Connection } from "@solana/web3.js";

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.post("/", async (req, res) => {
  const payload = req.body;
  console.log(payload);
  const conn = new Connection("https://api.mainnet-beta.solana.com");

  if (payload.params === undefined) {
    await (conn as any)
      ._rpcRequest(payload.method)
      .then((response: JSONRPCResponse) => {
        res.json(response.result);
        populateCacheWithResults(payload.method, payload.params, response);
      });
  } else {
    await (conn as any)
      ._rpcRequest(payload.method, payload.params)
      .then((response: JSONRPCResponse) => {
        res.json(response.result);
        populateCacheWithResults(payload.method, payload.params, response);
      });
  }
});

function populateCacheWithResults(
  method: string,
  params: JSONRPCParams | undefined,
  rpcResponse: JSONRPCResponse
) {
  const redisClient = redis.createClient();
  // Need to use method name and params as the key, response as the value
  let result = rpcResponse.result;
  console.log(result);
  redisClient.hset(
    method,
    params === undefined ? "" : JSON.stringify(params),
    JSON.stringify(result)
  );
}

export { app };
