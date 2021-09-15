import { JSONRPCClient, JSONRPCRequest } from "json-rpc-2.0";

const writerURL = "http://localhost:3001"

export const client = new JSONRPCClient(async (jsonRPCRequest: JSONRPCRequest) => {
  fetch(writerURL + "/cache-miss", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(jsonRPCRequest),
  }).then((response) => {
    if (response.status === 200) {
      return response
        .json()
        .then((jsonRPCResponse) => client.receive(jsonRPCResponse));
    } else if (jsonRPCRequest.id !== undefined) {
      return Promise.reject(new Error(response.statusText));
    }
  });
});
