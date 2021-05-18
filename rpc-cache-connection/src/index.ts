import { Commitment, Connection } from "@solana/web3.js";
import { settings } from "../../rpc-cache-utils/src/config";
import { parse as urlParse, UrlWithStringQuery } from "url";
import { createRpcClient, createRpcRequest } from "./rpc-utils";

const rpcRequestCreator = (url: UrlWithStringQuery, useHttps: boolean) => {
  const _rpcClient = createRpcClient(url.href, useHttps);
  const _rpcRequest = createRpcRequest(_rpcClient);
  // const _rpcBatchRequest = createRpcBatchRequest(_rpcClient);
  return _rpcRequest;
};

export const ConnectionProxy = (
  solanaEndpoint: string,
  cacheEnpoint: string
): Connection => {
  const originalConnection = new Connection(
    solanaEndpoint,
    settings.commitment as Commitment
  );

  const url = urlParse(cacheEnpoint);
  const useHttps = url.protocol === "https:";
  const proxyRpcCache = rpcRequestCreator(url, useHttps);

  // @ts-ignore
  const solanaRpcRequest = originalConnection._rpcRequest;
  const _rpcRequest = async (method: string, params: any) => {
    const mainParam = params[0];
    let useProxyCache = false;
    if (settings.cacheFunctions.names.indexOf(method) >= 0) {
      const configParams: Array<any> = (
        settings.cacheFunctions.params as Record<string, any>
      )[method];
      if (
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
};
