import { ConnectionProxy } from "../src";
import { settings } from "../../rpc-cache-utils/src/config";
import { Commitment, Connection } from "@solana/web3.js";

const AMOUNT = 10;

const filters = [
  {
    dataSize: 388,
  },
];
const params = {
  commitment: "recent",
  encoding: "base64",
  filters,
};

const originalConnection = new Connection(
  //"https://raydium.rpcpool.com",
  "https://solana-api.projectserum.com",
  settings.commitment as Commitment
);

const proxyCache = ConnectionProxy(
  "https://solana-api.projectserum.com",
  //"https://raydium.rpcpool.com",
  //"http://localhost:3001"
  "http://18.116.68.79:3001"
  //@ts-ignore
);

(async () => {
  // Solana's
  const solanaStart = new Date();
  let i = 0;
  while (i < AMOUNT) {
    //const solanasinlgestart = new Date()
    // @ts-ignore
    await originalConnection._rpcRequest("getProgramAccounts", [
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      // @ts-ignore
      params,
    ]);
    i++;
    // @ts-ignore
    //console.log(`solana # ${i}: ${new Date() - solanasinlgestart}`)
  }
  const solanaEnd = new Date();
  // @ts-ignore
  console.log(`Solana's elapsed time: ${solanaEnd - solanaStart}`);

  // cache's
  const cacheStart = new Date();
  let j = 0;
  let result: any = null;
  while (j < AMOUNT) {
    // @ts-ignore
    result = await proxyCache._rpcRequest("getProgramAccounts", [
      "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      // @ts-ignore
      params,
    ]);
    j++;
    // @ts-ignore
  }
  const cacheEnd = new Date();
  console.log(
    // @ts-ignore
    `Cache's elapsed time: ${cacheEnd - cacheStart}, results: ${
      result.result.length
    }`
  );
})();
