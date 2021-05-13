import { KeyedAccountInfo } from "@solana/web3.js";
import { JSONRPCParams } from "json-rpc-2.0";
import axios from "axios";
import { redisClient } from "../../../rpc-cache-utils/src/connection";
import { ParsedKeyedAccountInfo } from "../../../rpc-cache-utils/src/utils";
import bs58 from "bs58";

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
            const parsed: Array<ParsedKeyedAccountInfo> = reply.map((acc) =>
              JSON.parse(acc)
            );
            const filteredData = filterProgramAccounts(parsed, filters, programID)
            resolve(filteredData);
          }
        }
      });
    } else {
      resolve([]);
    }
  });
};

const filterProgramAccounts = (
  accounts: Array<ParsedKeyedAccountInfo>,
  config: Record<string, unknown>,
  programID: string,
): Array<ParsedKeyedAccountInfo>  => {
  console.log(config)
  const filters = config.filters || []
  const encoding = config.encoding || "base58"
  delete config.filters
  const filteredAccounts = accounts.filter((acc) => {
    const decodedData = bs58.decode((acc.account.data as string));
    acc.account.data = decodedData;
    for (const filter of (filters as any[])) {
      const dataSize = filter.dataSize;
      if (dataSize && decodedData.length === dataSize) {
        return true;
      }
    }
    return false
  })
  const parsedAccounts = filteredAccounts.map((acc) => {
    const decodedData = acc.account.data;
    if (encoding === "base64") {
      acc.account.data = (decodedData as Buffer).toString("base64")
    } else {
      acc.account.data = bs58.encode(decodedData as Buffer)
    }
    return acc
  })
  return parsedAccounts
}
