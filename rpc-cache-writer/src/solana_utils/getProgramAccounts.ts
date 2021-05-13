import { AccountInfo, KeyedAccountInfo, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  connection,
  redisClient,
} from "../../../rpc-cache-utils/src/connection";
import { settings } from "../../../rpc-cache-utils/src/config";

const webSocketsIds: Map<string, number> = new Map();

interface ParsedKeyedAccountInfo {
  pubkey: string;
  account: {
    executable: boolean;
    lamports: number;
    rentEpoch: number;
    owner: string;
    data: string;
  };
}

export const getProgramAccounts = async (
  programID: string,
  setWebSocket = false
): Promise<void> => {
  console.log(`Fetching: getProgramAccounts of ${programID}`);
  const resp = await (connection as any)._rpcRequest("getProgramAccounts", [
    programID,
    { commitment: settings.commitment },
  ]);
  await setRedisAccounts(resp.result, programID);

  if (setWebSocket) {
    const prevSubId = webSocketsIds.get(programID);
    if (prevSubId) {
      console.log(
        `removing listener Websocket for: onProgramAccountChange of ${programID}`
      );
      await connection.removeProgramAccountChangeListener(prevSubId);
    }
    console.log(
      `Creating Websocket for: onProgramAccountChange of ${programID}`
    );
    const subId = connection.onProgramAccountChange(
      new PublicKey(programID),
      async (info) => {
        const pubkey = info.accountId.toBase58();
        const accountInfo: ParsedKeyedAccountInfo = {
          pubkey: pubkey,
          account: {
            executable: info.accountInfo.executable,
            lamports: info.accountInfo.lamports,
            // @ts-ignore
            // it actually has this attr, but the type doesn't have it
            rentEpoch: info.accountInfo.rentEpoch,
            owner: info.accountInfo.owner.toBase58(),
            data: bs58.encode(Buffer.from(info.accountInfo.data)),
          },
        };
        redisClient.hset(programID, pubkey, JSON.stringify(accountInfo));
      }
    );
    webSocketsIds.set(programID, subId);
  }
};

const setRedisAccounts = async (
  accounts: Array<ParsedKeyedAccountInfo>,
  programID: string
) => {
  for (const acc of accounts) {
    const pubkey = acc.pubkey;
    const info = acc.account;
    const accountInfo = {
      pubkey: pubkey,
      account: {
        executable: info.executable,
        lamports: info.lamports,
        rentEpoch: info.rentEpoch,
        owner: info.owner,
        data: info.data,
      },
    };
    //console.log(`saving in cache ${pubkey} of ${programID}`)
    redisClient.hset(programID, pubkey, JSON.stringify(accountInfo));
  }
};
