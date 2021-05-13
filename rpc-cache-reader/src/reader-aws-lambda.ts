import { JSONRPCResponse, JSONRPCServer } from "json-rpc-2.0";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getProgramAccounts } from "./solana_utils/getProgramAccounts";
import { settings } from "../../rpc-cache-utils/src/config";
import { connection } from "../../rpc-cache-utils/src/connection";


const server = new JSONRPCServer();

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

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const jsonRPCRequest = JSON.parse(event.body as string);

  const functionNames = settings.cacheFunctions.names;
  if (functionNames.indexOf(jsonRPCRequest.method) >= 0) {
    server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
      if (jsonRPCResponse && jsonRPCResponse.error) {
        console.log("rejected: " + jsonRPCResponse.error);
        (connection as any)
          ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
          .catch((e: any) => {
            jsonRPCResponse.error = e;
            return {
              statusCode: 200,
              body: JSON.stringify(jsonRPCResponse),
            };
          })
          .then((resp: JSONRPCResponse) => {
            return {
              statusCode: 200,
              body: JSON.stringify(resp),
            };
          });
      } else if (jsonRPCResponse && !jsonRPCResponse.error) {
        return {
          statusCode: 200,
          body: JSON.stringify(jsonRPCResponse),
        };
      } else {
        return {
          statusCode: 204,
          body: "There was no response.",
        };
      }
    });
  } else {
    (connection as any)
      ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
      .catch((e: any) => {
        return {
          statusCode: 500,
          body: e.toString(),
        };
      })
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
