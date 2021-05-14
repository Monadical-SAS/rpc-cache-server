import redis from "redis";

export const getRedisClient = (): redis.RedisClient => {
  if (process.env.ENV === "AWS") {
    return redis.createClient(
      `https://${process.env.REDIS_SERVER_URL}:${process.env.REDIS_SERVER_PORT}`
    );
  } else {
    return redis.createClient();
  }
};
