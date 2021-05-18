import RpcClient from "jayson/lib/client/browser";
import { AgentManager } from "./agent-manager";
import { sleep } from "../../rpc-cache-utils/src/utils";
import fetch, { Response } from "node-fetch";

export type RpcParams = {
  methodName: string;
  args: Array<any>;
};

export type RpcRequest = (methodName: string, args: Array<any>) => any;

type RpcBatchRequest = (requests: RpcParams[]) => any;

export function createRpcClient(url: string, useHttps: boolean): RpcClient {
  let agentManager: AgentManager | undefined;
  if (!process.env.BROWSER) {
    agentManager = new AgentManager(useHttps);
  }

  const clientBrowser = new RpcClient(async (request, callback) => {
    const agent = agentManager ? agentManager.requestStart() : undefined;
    const options = {
      method: "POST",
      body: request,
      agent,
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      let too_many_requests_retries = 5;
      let res: Response;
      let waitTime = 500;
      for (;;) {
        res = await fetch(url, options);
        if (res.status !== 429 /* Too many requests */) {
          break;
        }
        too_many_requests_retries -= 1;
        if (too_many_requests_retries === 0) {
          break;
        }
        console.log(
          `Server responded with ${res.status} ${res.statusText}.  Retrying after ${waitTime}ms delay...`
        );
        await sleep(waitTime);
        waitTime *= 2;
      }

      const text = await res.text();
      if (res.ok) {
        callback(null, text);
      } else {
        callback(new Error(`${res.status} ${res.statusText}: ${text}`));
      }
    } catch (err) {
      callback(err);
    } finally {
      agentManager && agentManager.requestEnd();
    }
  }, {});

  return clientBrowser;
}

export function createRpcRequest(client: RpcClient): RpcRequest {
  return (method, args) => {
    return new Promise((resolve, reject) => {
      client.request(method, args, (err: any, response: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });
  };
}

export function createRpcBatchRequest(client: RpcClient): RpcBatchRequest {
  return (requests: RpcParams[]) => {
    return new Promise((resolve, reject) => {
      // Do nothing if requests is empty
      if (requests.length === 0) resolve([]);

      const batch = requests.map((params: RpcParams) => {
        return client.request(params.methodName, params.args);
      });

      client.request(batch, (err: any, response: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
      });
    });
  };
}
