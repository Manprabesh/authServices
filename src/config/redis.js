import { createClient } from "redis";

let redisClient;

export const getRedisClient = async () => {
  if (!redisClient) {

    redisClient = createClient({
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    });

    redisClient.on("error", (err) => {
      console.error("Redis Error:", err);
    });

    await redisClient.connect();
    console.log("Redis connected");
  }

  return redisClient;
};