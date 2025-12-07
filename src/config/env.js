require("dotenv").config();

module.exports = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_DB: parseInt(process.env.REDIS_DB || "0", 10),
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/leaderboard",
  MONGO_DB_NAME: process.env.MONGO_DB_NAME || "leaderboard",
  MONGO_COLLECTION: process.env.MONGO_COLLECTION || "scores",
  BATCH_INTERVAL_MS: parseInt(process.env.BATCH_INTERVAL_MS || "5000", 10),
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || "100", 10),
  LEADERBOARD_TOP_N: parseInt(process.env.LEADERBOARD_TOP_N || "100", 10),
  DAILY_RESET_ENABLED: process.env.DAILY_RESET_ENABLED === "true",
  DAILY_RESET_CRON: process.env.DAILY_RESET_CRON || "0 0 * * *",
};
