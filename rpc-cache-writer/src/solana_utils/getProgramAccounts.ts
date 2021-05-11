import {connection, redisClient} from "./connection";
import { KeyedAccountInfo, PublicKey} from "@solana/web3.js";

const webSocketsIds: Map<string, number> = new Map();

export const getProgramAccounts = async  (programID: string, setWebSocket=false) => {

  console.log(`Fetching: getProgramAccounts of ${programID}`)
  const resp = await (connection as any)._rpcRequest(
    "getProgramAccounts",
    [
      programID,
      {}
    ]);
    await setRedisAccounts(resp.result, programID)

    if (setWebSocket) {
      const prevSubId = webSocketsIds.get(programID);
      if (prevSubId) {
        console.log(`removing listener Websocket for: onProgramAccountChange of ${programID}`)
        await connection.removeProgramAccountChangeListener(prevSubId)
      }
      console.log(`Creating Websocket for: onProgramAccountChange of ${programID}`)
      const subId = connection.onProgramAccountChange(
        new PublicKey(programID),
        async (info: KeyedAccountInfo) => {
          const pubkey =
            typeof info.accountId === 'string'
              ? info.accountId
              : info.accountId.toBase58();
          redisClient.hset(programID, pubkey, JSON.stringify(info.accountInfo))
        },
      )
      webSocketsIds.set(programID, subId)
    }
}

const setRedisAccounts = async (accounts: Array<any>, programID: string) => {
  for (const acc of accounts) {
    const pubkey = acc.pubkey;
    //console.log(`saving in cache ${pubkey} of ${programID}`)
    redisClient.hset(programID, pubkey, JSON.stringify(acc))
  }
}