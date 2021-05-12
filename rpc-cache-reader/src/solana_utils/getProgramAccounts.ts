import { KeyedAccountInfo } from "@solana/web3.js";
import { JSONRPCParams } from "json-rpc-2.0";
import axios from "axios";
import { redisClient } from "../../../rpc-cache-utils/src/connection";

export const getProgramAccounts = (
  params: Partial<JSONRPCParams> | undefined
): Promise<Array<any>> => {
  return new Promise((resolve, reject) => {
    if (params) {
      const programID = (params as any[])[0];
      const filters = (params as any[])[1];
      redisClient.hvals(programID, function (err, reply) {
        if (err) {
          reject(err);
        } else {
          if (reply === null) {
            axios({
              method: "post",
              url: "http://localhost:3001/",
              data: { method: "getProgramAccounts", mainParam: programID },
            });
            reject(err);
          } else {
            const parsed: Array<KeyedAccountInfo> = reply.map((acc) =>
              JSON.parse(acc)
            );
            resolve(parsed);
          }
        }
      });
    } else {
      resolve([]);
    }
  });
};

// const filterProgramAccounts = (accounts: Array<KeyedAccountInfo>, config: Map<string, any>): Array<KeyedAccountInfo>  => {
//   const filters = config.get("filters")
//   config.delete("filters")
//   return accounts
// }
