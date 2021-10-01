import { createClient, RedisClient } from "redis";
import request from "supertest";
import { app } from "./index";

beforeEach(() => {
  const redisClient = createClient();
  fillRedisWithMockData(redisClient);
});

afterEach(() => {
  const redisClient = createClient();
  clearRedis(redisClient);
});

describe("Handles cache miss by fetching the relevant info from Solana, filling the cache with it, and returning the info to the reader", () => {
  it("Handles the cache miss and gets the value to write to the cache", () => {
    return request(app)
      .post("/")
      .send({ jsonrpc: "2.0", id: 1, method: "getInflationRate" })
      .expect("Content-Type", /json/)
      .expect(200)
      .then((response) => {
        console.log(response.body);
        expect(response.body.total).toBe(0.07450250146012559); // Note: this will probably need to be updated in the future since this property is likely to change in value. Or, even better, figure out a different property to test the value of to ensure we got correct response.
        // TODO: Check to see if there's a value in the Redis cache for this method now
        const redisClient = createClient();
        redisClient.hget("getInflationRate", "", (err, reply) => {
          expect(reply).not.toBeNull();
        });
      });
  });
});

// describe("Tests for cache invalidation", () => {
//   it("Updates cache when values change on the WebSocket that's being watched", () => {});
// });

function fillRedisWithMockData(redisClient: RedisClient) {
  console.log("Filling Redis");

  // getAccountInfo
  redisClient.hset(
    "getAccountInfo",
    JSON.stringify([
      "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg",
      {
        encoding: "base58",
      },
    ]),
    JSON.stringify({
      jsonrpc: "2.0",
      result: {
        context: {
          slot: 1,
        },
        value: {
          data: [
            "11116bv5nS2h3y12kD1yUKeMZvGcKLSjQgX6BeV7u1FrjeJcKfsHRTPuR3oZ1EioKtYGiYxpxMG5vpbZLsbcBYBEmZZcMKaSoGx9JZeAuWf",
            "base58",
          ],
          executable: false,
          lamports: 1000000000,
          owner: "11111111111111111111111111111111",
          rentEpoch: 2,
        },
      },
      id: 1,
    })
  );

  // getProgramAccounts
  redisClient.hset(
    "getProgramAccounts",
    JSON.stringify(["4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T"]),
    JSON.stringify({
      jsonrpc: "2.0",
      result: [
        {
          account: {
            data: "2R9jLfiAQ9bgdcw6h8s44439",
            executable: false,
            lamports: 15298080,
            owner: "4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T",
            rentEpoch: 28,
          },
          pubkey: "CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY",
        },
      ],
      id: 1,
    })
  );
}

function clearRedis(redisClient: RedisClient) {
  redisClient.flushall();
}
