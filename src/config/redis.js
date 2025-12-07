const Redis = require("ioredis");
const config = require("./env");

let redisClient = null;
let redisPubClient = null;
let redisSubClient = null;

function createRedisClient() {
  return new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    db: config.REDIS_DB,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
}

async function connectRedis() {
  redisClient = createRedisClient();
  redisPubClient = createRedisClient();
  redisSubClient = createRedisClient();

  redisClient.on("error", (err) => console.error("Redis Client Error:", err));
  redisPubClient.on("error", (err) => console.error("Redis Pub Error:", err));
  redisSubClient.on("error", (err) => console.error("Redis Sub Error:", err));

  await redisClient.ping();
  await redisPubClient.ping();
  await redisSubClient.ping();

  return { redisClient, redisPubClient, redisSubClient };
}

function getRedisClient() {
  if (!redisClient) throw new Error("Redis not initialized. Call connectRedis() first.");
  return redisClient;
}

function getRedisPubClient() {
  if (!redisPubClient) throw new Error("Redis Pub not initialized. Call connectRedis() first.");
  return redisPubClient;
}

function getRedisSubClient() {
  if (!redisSubClient) throw new Error("Redis Sub not initialized. Call connectRedis() first.");
  return redisSubClient;
}

module.exports = { connectRedis, getRedisClient, getRedisPubClient, getRedisSubClient };
