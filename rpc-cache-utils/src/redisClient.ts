import redis from "redis";

export const getRedisClient = (): redis.RedisClient => {
  if (process.env.ENV?.toLowerCase() === "aws") {
    return redis.createClient(
      `${process.env.REDIS_SERVER_URL}:${process.env.REDIS_SERVER_PORT}`
    );
  } else {
    return redis.createClient();
  }
};
