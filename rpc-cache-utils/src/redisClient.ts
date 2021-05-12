import redis from "redis";

export const getRedisClient = () => {
  return redis.createClient();
};
