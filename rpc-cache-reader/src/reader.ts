import { JSONRPCResponse, JSONRPCServer } from "json-rpc-2.0";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { settings } from "./_config";
import { Connection } from "@solana/web3.js";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getProgramAccounts } from "./solana_utils/getProgramAccounts";

const connection = new Connection(
  "https://solana-api.projectserum.com/",
  "recent"
);

const server = new JSONRPCServer();

const app = express();
app.use(bodyParser.json());
app.use(cors());

for (const func of settings.cacheFunctions) {
  switch (func.name) {
    case "getProgramAccounts": {
      server.addMethod("getProgramAccounts", getProgramAccounts);
      break;
    }
    default:
      break;
  }
}

app.post("/json-rpc", (req, res) => {
  const jsonRPCRequest = req.body;
  // server.receive takes a JSON-RPC request and returns a Promise of a JSON-RPC response.
  console.log("received request");
  console.log(jsonRPCRequest);
  const functionNames = settings.cacheFunctions.map((func) => func.name);
  if (functionNames.indexOf(jsonRPCRequest.method) >= 0) {
    server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
      if (jsonRPCResponse) {
        res.json(jsonRPCResponse);
      } else {
        console.log("no response");
        res.sendStatus(204);
      }
    });
  } else {
    (connection as any)
      ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
      .then((resp: JSONRPCResponse) => {
        res.json(resp);
      });
  }
});

app.listen(3001);

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const queries = JSON.stringify(event.queryStringParameters);
  return {
    statusCode: 200,
    body: `Queries: ${queries}`,
  };
};
