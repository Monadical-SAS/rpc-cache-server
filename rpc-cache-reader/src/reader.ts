import { JSONRPCParams, JSONRPCResponse, JSONRPCServer } from "json-rpc-2.0";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { connection } from "../../rpc-cache-utils/src/connection";
import { getProgramAccounts } from "./solana_utils/getProgramAccounts";
import { settings } from "../../rpc-cache-utils/src/config";
import * as util from "util";
import { JSONRPCRequest } from "json-rpc-2.0";

const server = new JSONRPCServer();

const app = express();
app.use(bodyParser.json() as RequestHandler);
app.use(cors());

let seenRPCs = new Set<[any, any]>();

for (const name of settings.cacheFunctions.names) {
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
    res.json(writerResponse);
  }
});

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
