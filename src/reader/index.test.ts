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

describe("Returns cached results in format that solana-web3.js expects", () => {
  it("should make a getProgramAccounts RPC and return the correct response", () => {
    return request(app)
      .post("/")
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "getProgramAccounts",
        params: ["4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T"],
      })
      .expect("Content-Type", /json/)
      .expect(200)
      .then((response) => {
        expect(response.body).toBe(
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
      });
  });

  it("should make a getAccountInfo RPC and return the correct response", () => {
    return request(app)
      .post("/")
      .send({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [
          "vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg",
          {
            encoding: "base58",
          },
        ],
      })
      .expect("Content-Type", /json/)
      .expect(200)
      .then((response) => {
        expect(response.body).toBe(
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
      });
  });
});

// TODO: This can be added later, not super important since the writer is tested independently
// describe("Cache misses", () => {});

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
