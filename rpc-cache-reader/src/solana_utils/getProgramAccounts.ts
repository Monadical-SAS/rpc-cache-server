import { JSONRPCParams } from "json-rpc-2.0";
import { redisReadClient } from "../../../rpc-cache-utils/src/connection";
import { ParsedKeyedAccountInfo } from "../../../rpc-cache-utils/src/utils";
import bs58 from "bs58";

export const getProgramAccounts = async (
  params: Partial<JSONRPCParams> | undefined
): Promise<Array<any>> => {
  return new Promise((resolve, reject) => {
    if (params) {
      const programID = (params as any[])[0];
      const filters = (params as any[])[1];
      redisReadClient.hvals(programID, function (err, reply) {
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
  const filters = config.filters || [];
  const encoding = config.encoding || "binary";
  const data_slice_config = config.data_slice_config || null;
  delete config.filters;
  const filteredAccounts = accounts.filter((acc) => {
    if (acc.account.owner !== programID) {
      return false;
    }
    const decodedData = Buffer.from(acc.account.data[0] as string, "base64");

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
        // @ts-ignore
        console.log("first decoding", end - start);
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
    if (encoding === "binary") {
      acc.account.data = bs58.encode(
        sliceData(decodedData as Buffer, data_slice_config)
      );
    } else if (encoding === "base64") {
      acc.account.data = [
        sliceData(decodedData as Buffer, data_slice_config).toString("base64"),
        encoding,
      ];
    } else {
      acc.account.data = [
        bs58.encode(sliceData(decodedData as Buffer, data_slice_config)),
        encoding,
      ];
    }
    return acc;
  });
};

const sliceData = (data: any, data_slice: any) => {
  if (
    data_slice !== null &&
    typeof data_slice.offset === "number" &&
    typeof data_slice.length === "number"
  ) {
    const offset = data_slice.offset;
    const length = data_slice.length;
    if (offset > data.length) {
      return [];
    } else if (length > data.length - offset) {
      return data.slice(offset);
    } else {
      return data.slice(offset, length);
    }
  } else {
    return data;
  }
};
