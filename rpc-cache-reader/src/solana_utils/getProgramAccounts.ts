import { JSONRPCParams } from "json-rpc-2.0";
import { redisClient } from "../../../rpc-cache-utils/src/connection";
import { ParsedKeyedAccountInfo } from "../../../rpc-cache-utils/src/utils";
import bs58 from "bs58";
import util from "util";

export const getProgramAccounts = async (
  params: Partial<JSONRPCParams> | undefined
): Promise<Array<any>> => {
    console.log("In getProgramAccounts function in solana_utils/getProgramAccounts.ts in read");
  return new Promise((resolve, reject) => {
    if (params) {
      const programID = (params as any[])[0];
      const filters = (params as any[])[1];
      redisClient.hvals(programID, function (err, reply) {
        if (!reply || reply.length === 0 || err) {
          if (err) console.log(err);
          reject(err);
        } else {
          const parsed: Array<ParsedKeyedAccountInfo> = reply.map((acc) =>
            JSON.parse(acc)
          );
          resolve(filterProgramAccounts(parsed, filters, programID));
        }
      });
    } else {
      reject("no parameters");
    }
  });
};

const filterProgramAccounts = (
  accounts: Array<ParsedKeyedAccountInfo>,
  config: Record<string, unknown>,
  programID: string
): Array<ParsedKeyedAccountInfo> => {
  console.log(util.inspect(config, { showHidden: false, depth: null }));
  const filters = config.filters || [];
  const encoding = config.encoding || "base58";
  delete config.filters;
  const filteredAccounts = accounts.filter((acc) => {
    if (acc.account.owner !== programID) {
      return false;
    }
    const decodedData = bs58.decode(acc.account.data as string);
    acc.account.data = decodedData;
    for (const filter of filters as any[]) {
      const dataSize = filter.dataSize;
      const memcmp = filter.memcmp;
      const memcmpData = {
        offset: memcmp?.offset,
        bytes: memcmp?.bytes,
      };
      if (dataSize && !(decodedData.length === dataSize)) {
        return false;
      }
      if (memcmpData.offset !== undefined && memcmpData.bytes !== undefined) {
        let dBytes;
        const dataArray = decodedData;
        try {
          dBytes = bs58.decode(memcmpData.bytes);
        } catch {
          return false;
        }
        if (memcmpData.offset > decodedData.length) {
          return false;
        }
        if (dataArray.slice(memcmpData.offset).length < dBytes.length) {
          return false;
        }
        return (
          dataArray.compare(
            dBytes,
            0,
            dBytes.length,
            memcmpData.offset,
            memcmpData.offset + dBytes.length
          ) === 0
        );
      }
    }
    return true;
  });
  return filteredAccounts.map((acc) => {
    const decodedData = acc.account.data;
    if (encoding === "base64") {
      acc.account.data = (decodedData as Buffer).toString("base64");
    } else {
      acc.account.data = bs58.encode(decodedData as Buffer);
    }
    return acc;
  });
};
