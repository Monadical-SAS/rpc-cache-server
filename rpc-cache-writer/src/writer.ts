import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { getProgramAccounts } from "./solana_utils/getProgramAccounts";
import { settings } from "../../rpc-cache-utils/src/config";
import { connection } from "../../rpc-cache-utils/src/connection";
import { Connection } from "@solana/web3.js";
import { JSONRPCRequest } from "json-rpc-2.0";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const callCorrespondingCachedMethod = async (
  name: string,
  param: any,
  filters: Array<any> | undefined,
  setWebSocket = false
): Promise<void> => {
  switch (name) {
    case "getProgramAccounts": {
      if (
        settings.cacheFunctions.params.getProgramAccounts.indexOf(param) >= 0
      ) {
        await getProgramAccounts(param, filters, setWebSocket);
      }
      break;
    }
    default:
      break;
  }
};

const preCache = async () => {
  for (const name of settings.cacheFunctions.names) {
    const params = (settings.cacheFunctions.params as Record<string, any>)[
      name
    ];
    const filterByName = (settings.cacheFunctions.filters as Record<any, any>)[
      name
    ];
    if (!params) {
      await callCorrespondingCachedMethod(name, undefined, undefined, true);
    } else {
      console.log(
        `Populating cache with method: ${name} for params: ${params}`
      );
      for (const mainParam of params) {
        let filters: Array<any> = [];
        if (filterByName) {
          filters = filterByName[mainParam];
        }
        await callCorrespondingCachedMethod(name, mainParam, filters, true);
      }
    }
  }
  console.log("Finished Populating cache");
};

preCache();

app.post("/cache-miss", (req, res) => {
  const request = req.body as JSONRPCRequest;
  let rpcResponse;
  makeSolanaRPCRequest(request.method, request.params).then((response: any) => {
    rpcResponse = response;
    res.json(response);
  });
  populateCacheWithResults(rpcResponse);
  // TODO: If a WebSocket needs to be opened to watch for changes, open it
});

app.listen(process.env.WRITER_PORT);
