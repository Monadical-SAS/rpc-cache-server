import { JSONRPCParams, JSONRPCResponse, JSONRPCServer } from "json-rpc-2.0";
import express, { RequestHandler, response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import {
  connection,
  redisReadClient,
} from "../../rpc-cache-utils/src/connection";
import { getProgramAccounts } from "./solana_utils/getProgramAccounts";
import { settings } from "../../rpc-cache-utils/src/config";
import { JSONRPCRequest } from "json-rpc-2.0";
import {
  client,
  client as writerClient,
} from "../../rpc-cache-utils/src/writerClient";

const server = new JSONRPCServer();

const app = express();
app.use(bodyParser.json() as RequestHandler);
app.use(cors());

let seenRPCs = new Set<[any, any]>();

for (const name of settings.cacheFunctions.names) {
  // TODO: Reform how this pre-caching is handled.
  switch (name) {
    case "getProgramAccounts": {
      seenRPCs.add([name, ""]);
      server.addMethod("getProgramAccounts", getProgramAccounts);
      break;
    }
    default:
      break;
  }
}

function getCachedValue(jsonRPCRequest: JSONRPCRequest): any {
  const method = jsonRPCRequest.method;
  const params = jsonRPCRequest.params;
  return redisReadClient.hget(method, JSON.stringify(params));
}

app.post("/", (req, res) => {
  const jsonRPCRequest = req.body as JSONRPCRequest;
  // server.receive takes a JSON-RPC request and returns a Promise of a JSON-RPC response.
  console.log("received request", jsonRPCRequest.method, jsonRPCRequest.params);
  if (seenRPCs.has([jsonRPCRequest.method, jsonRPCRequest.params])) {
    console.log("This RPC has been seen.");
    res.json(getCachedValue(jsonRPCRequest));
  } else {
    console.log("This RPC has not been seen yet. Going to cache now.");
    seenRPCs.add([jsonRPCRequest.method, jsonRPCRequest.params]);
    const writerResponse = askWriterForValue(jsonRPCRequest);
    writerResponse.then((jsonRPCResponse) => {
      res.json(jsonRPCResponse);
    });
  }
});

async function askWriterForValue(jsonRPCRequest: JSONRPCRequest) {
  // Make JSON-RPC request to the Writer and return the value that the Writer gives back
  return await client.request(jsonRPCRequest.method, jsonRPCRequest.params);
}

function genericSolanaRPCHandler(jsonRPCRequest: JSONRPCRequest, res: any) {
  return async (params: Partial<JSONRPCParams> | undefined) => {
    return new Promise((resolve, reject) => {
      if (params) {
        resolve(
          (connection as any)
            ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
            .catch((e: any) => {
              res.json({ error: e });
            })
            .then((resp: JSONRPCResponse) => {
              res.json(resp);
            })
        );
      } else {
        reject("No parameters provided");
      }
    });
  };
}

app.get("/settings", (req, res) => {
  res.json(JSON.stringify(settings));
});

app.get("/health", (req, res) => {
  res.sendStatus(200);
});

app.listen(process.env.READER_PORT);
