import { JSONRPCResponse, JSONRPCServer } from "json-rpc-2.0";
import { Connection } from "@solana/web3.js";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getProgramAccounts } from "./solana_utils/getProgramAccounts";
import { settings } from "../../rpc-cache-utils/src/config";

const connection = new Connection(
  "https://solana-api.projectserum.com/",
  "recent"
);

const server = new JSONRPCServer();

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

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

    const jsonRPCRequest = JSON.parse(event.body as string);

    const functionNames = settings.cacheFunctions.map((func) => func.name);
    if (functionNames.indexOf(jsonRPCRequest.method) >= 0) {
        server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
            if (jsonRPCResponse) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(jsonRPCResponse),
                };
            } else {
                console.log("no response");
                return {
                    statusCode: 204,
                    body: "There was no response."
                };
            }
        });
    } else {
        (connection as any)
            ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
            .then((resp: JSONRPCResponse) => {
                return {
                    statusCode: 200,
                    body: JSON.stringify(resp),
                };
            });
    }
  return {
    statusCode: 204,
    body: "There was no response.",
  };
};
