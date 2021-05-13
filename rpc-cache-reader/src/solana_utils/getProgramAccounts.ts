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
      //const filters = (params as any[])[1];
      redisClient.hvals(programID, function (err, reply) {
        if (err) {
          reject(err);
        } else {
          if (reply === null) {
            axios({
              method: "post",
              url: "http://18.116.202.148:3000",
              data: { method: "getProgramAccounts", mainParam: programID },
            });
            reject(err);
          }
          const parsed: Array<KeyedAccountInfo> = [];
          for (const acc of reply) {
            try {
              parsed.push(JSON.parse(acc));
            } catch (e) {
              console.log(acc);
            }
          }
          resolve(parsed);
        }
      });
    } else {
      resolve([]);
    }
  });
};
