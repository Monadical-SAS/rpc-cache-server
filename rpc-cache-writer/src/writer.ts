import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { settings } from './_config';
import { getProgramAccounts } from './solana_utils/getProgramAccounts';

const app = express();
app.use(bodyParser.json());
app.use(cors());

const callCorrespondingCachedMethod = async (
  name: string,
  param: any,
  setWebSocket = false,
) => {
  switch (name) {
    case 'getProgramAccounts': {
      await getProgramAccounts(param, setWebSocket);
      break;
    }
    default:
      break;
  }
};

(async () => {
  for (const func of settings.cacheFunctions) {
    console.log(
      `Populating cache with method: ${func.name} for params: ${func.params}`,
    );
    for (const mainParam of func.params) {
      await callCorrespondingCachedMethod(func.name, mainParam, true);
    }
  }
  console.log('Finished Populating cache');
})();

app.post('/', (req, res) => {
  // when this is called, it means a cache miss happened and the cache needs to be written to.
  // to do this, make an RPC call to the full node and write the value to cache.
  const { method, mainParam } = req.body;
  console.log(`Cache invalidation: ${{ method, mainParam }}`);
  (async () => {
    await callCorrespondingCachedMethod(method, mainParam, true);
  })();
  return res.sendStatus(200);
});

app.listen(3002);
