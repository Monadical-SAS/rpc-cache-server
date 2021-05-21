import redis from "redis";

export enum RedisClientUser {
	Reader,
	Writer
};

export const getRedisClient = (clientType : RedisClientUser): redis.RedisClient => {
  if (process.env.ENV?.toLowerCase() === "aws") {
    return redis.createClient(
      clientType === RedisClientUser.Reader ? `${process.env.REDIS_SERVER_READ_URL}:${process.env.REDIS_SERVER_PORT}` :
	      				      `${process.env.REDIS_SERVER_PRIMARY_URL}:${process.env.REDIS_SERVER_PORT}`
    );
  } else {
    return redis.createClient();
  }
};
