import { JSONRPCResponse, JSONRPCServer } from "json-rpc-2.0";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { connection } from "../../rpc-cache-utils/src/connection";
import { getProgramAccounts } from "./solana_utils/getProgramAccounts";
import { settings } from "../../rpc-cache-utils/src/config";
import * as util from "util";

const server = new JSONRPCServer();

const app = express();
app.use(bodyParser.json() as RequestHandler);
app.use(cors());

for (const name of settings.cacheFunctions.names) {
  switch (name) {
    case "getProgramAccounts": {
      server.addMethod("getProgramAccounts", getProgramAccounts);
      break;
    }
    default:
      break;
  }
}

app.post("/", (req, res) => {
  const jsonRPCRequest = req.body;
  // server.receive takes a JSON-RPC request and returns a Promise of a JSON-RPC response.
  console.log("received request", jsonRPCRequest.method, jsonRPCRequest.params);
  const functionNames = settings.cacheFunctions.names;
  if (functionNames.indexOf(jsonRPCRequest.method) >= 0) {
    console.log("RPC method found in the config file");
    server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
      if (jsonRPCResponse && jsonRPCResponse.error) {
        console.log(
          "rejected: " + util.inspect(jsonRPCResponse.error, { depth: null })
        );
        (connection as any)
          ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
          .catch((e: any) => {
            jsonRPCResponse.error = e;
            res.json(jsonRPCResponse);
          })
          .then((resp: JSONRPCResponse) => {
            res.json(resp);
          });
      } else if (jsonRPCResponse && !jsonRPCResponse.error) {
        res.json(jsonRPCResponse);
      } else {
        res.sendStatus(204);
      }
    });
  } else {
    console.log("not handled");
    (connection as any)
      ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
      .catch((e: any) => {
        res.json({ error: e });
      })
      .then((resp: JSONRPCResponse) => {
        res.json(resp);
      });
  }
});

app.get("/settings", (req, res) => {
  res.json(JSON.stringify(settings));
});

app.get("/health", (req, res) => {
  res.sendStatus(200);
});

app.listen(process.env.READER_PORT);
