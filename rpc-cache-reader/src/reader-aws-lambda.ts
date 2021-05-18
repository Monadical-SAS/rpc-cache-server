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
    console.log("RPC Request: " + (event.body as string));

    const functionNames = settings.cacheFunctions.names;
    console.log(functionNames);
    var responseToReturn = {
        statusCode: 204,
        body: "There was no response.",
    };

    if (functionNames.indexOf(jsonRPCRequest.method) >= 0) {
        console.log("We're in the if");
        await server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
            console.log("The jsonRPCResponse: ", jsonRPCResponse);
            if (jsonRPCResponse && jsonRPCResponse.error) {
                console.log("rejected: " + jsonRPCResponse.error);
                (connection as any)
                    ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
                    .catch((e: any) => {
                        jsonRPCResponse.error = e;
	                      console.log("Response: " + JSON.stringify(jsonRPCResponse));
                        responseToReturn = {
                            statusCode: 200,
                            body: JSON.stringify(jsonRPCResponse),
                        };
                    })
                    .then((resp: JSONRPCResponse) => {
	                      console.log("Response: " + JSON.stringify(resp));
                        responseToReturn = {
                            statusCode: 200,
                            body: JSON.stringify(resp),
                        };
                    });
            } else if (jsonRPCResponse && !jsonRPCResponse.error) {
	              console.log("Response: " + JSON.stringify(jsonRPCResponse));
                responseToReturn = {
                    statusCode: 200,
                    body: JSON.stringify(jsonRPCResponse),
                };
            } else {
                console.log("204: There was no response");
                responseToReturn = {
                    statusCode: 204,
                    body: "There was no response.",
                };
            }
        },
                                                  (e) => console.log(e));
    } else {
        console.log("We're in the else");
        (connection as any)
            ._rpcRequest(jsonRPCRequest.method, jsonRPCRequest.params)
            .catch((e: any) => {
                console.log("Response: 500`");
                responseToReturn = {
                    statusCode: 500,
                    body: e.toString(),
                };
            })
            .then((resp: JSONRPCResponse) => {
	              console.log("Response: " + JSON.stringify(resp));
                responseToReturn = {
                    statusCode: 200,
                    body: JSON.stringify(resp),
                };
            });
    }
    console.log("Reached the end");
    return responseToReturn;
};
