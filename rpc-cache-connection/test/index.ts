import { ConnectionProxy as Connection } from "../../rpc-cache-connection/src";

import * as util from "util";

const filters = [
  {
    dataSize: 34,
  },
];
const params = {
  commitment: "recent",
  encoding: "base64",
  filters,
};

(async () => {
  try {
    const list = await Connection(
      "https://solana-api.projectserum.com",
      "http://localhost:3001"
      //@ts-ignore
    )._rpcRequest("getProgramAccounts", [
      "WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC",
      params,
    ]);
    if (list && list.result?.length) {
      console.log(
        util.inspect(list.result.slice(0, 2), {
          showHidden: false,
          depth: null,
        })
      );
    } else {
      console.log(list);
    }
  } catch (e) {
    console.log(util.inspect(e, { showHidden: false, depth: null }));
  }
})();
