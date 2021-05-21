import { Commitment, Connection } from "@solana/web3.js";
import { parse as urlParse, UrlWithStringQuery } from "url";
import { createRpcClient, createRpcRequest } from "./rpc-utils";
import fetch from "node-fetch";

const rpcRequestCreator = (
  url: UrlWithStringQuery,
  useHttps: boolean,
  rpcFallback: any
) => {
  const _rpcClient = createRpcClient(url.href, useHttps);
  const _rpcRequest = createRpcRequest(_rpcClient, rpcFallback);
  // const _rpcBatchRequest = createRpcBatchRequest(_rpcClient);
  return _rpcRequest;
};

export const ConnectionProxy = async (
  solanaEndpoint: string,
  cacheEnpoint: string,
  defaultCommitment: Commitment = "confirmed"
): Promise<Connection> => {
  try {
    const settings = JSON.parse(
      await fetch(`${cacheEnpoint}/settings`).then((res) => res.json())
    );
    const originalConnection = new Connection(
      solanaEndpoint,
      settings.commitment as Commitment
    );
    // @ts-ignore
    const solanaRpcRequest = originalConnection._rpcRequest;

    const url = urlParse(cacheEnpoint);
    const useHttps = url.protocol === "https:";
    const proxyRpcCache = rpcRequestCreator(url, useHttps, solanaRpcRequest);

    const _rpcRequest = async (method: string, params: any) => {
      const mainParam = params[0];
      const filters = params[1];
      let useProxyCache = false;
      if (
        !(settings.unsupportedEncoding.indexOf(filters?.enconding) >= 0) &&
        settings.cacheFunctions.names.indexOf(method) >= 0
      ) {
        const configParams: Array<any> = ((settings.cacheFunctions
          .params as Record<string, any>) || {})[method];
        if (!configParams) {
          useProxyCache = true;
        } else if (
          Array.isArray(mainParam) &&
          mainParam.every((param) => configParams.indexOf(param) >= 0)
        ) {
          useProxyCache = true;
        } else if (configParams.indexOf(mainParam) >= 0) {
          useProxyCache = true;
        }
      }

      if (useProxyCache) {
        return proxyRpcCache(method, params);
      }
      return solanaRpcRequest(method, params);
    };

    const connection: Connection = Object.assign(originalConnection, {
      _rpcRequest: _rpcRequest,
    });
    return connection;
  } catch {
    return new Connection(solanaEndpoint, defaultCommitment);
  }
};
