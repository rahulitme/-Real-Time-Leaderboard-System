const cron = require("node-cron");
const config = require("../config/env");
const { clearLeaderboard } = require("../services/leaderboardService");
const { publishLeaderboardReset } = require("../services/pubsubService");
const { invalidateLeaderboardCache } = require("../services/cacheService");
const { getRedisClient } = require("../config/redis");

/**
 * Schedule daily leaderboard reset
 */
function scheduleDailyReset(leaderboardId = "daily") {
  if (!config.DAILY_RESET_ENABLED) {
    console.log("⏸️  Daily reset is disabled");
    return null;
  }

  const task = cron.schedule(config.DAILY_RESET_CRON, async () => {
    try {
      console.log(`\n🔄 Running daily reset for leaderboard: ${leaderboardId}`);

      // Clear leaderboard
      await clearLeaderboard(leaderboardId);

      // Invalidate cache
      await invalidateLeaderboardCache(leaderboardId);

      // Publish reset event
      await publishLeaderboardReset(leaderboardId);

      console.log(`✅ Daily reset completed for: ${leaderboardId}\n`);
    } catch (error) {
      console.error("❌ Error during daily reset:", error);
    }
  });

  console.log(`⏰ Daily reset scheduled with cron: ${config.DAILY_RESET_CRON}`);
  return task;
}

/**
 * Manual reset trigger
 */
async function manualReset(leaderboardId) {
  try {
    console.log(`\n🔄 Manual reset triggered for: ${leaderboardId}`);

    await clearLeaderboard(leaderboardId);
    await invalidateLeaderboardCache(leaderboardId);
    await publishLeaderboardReset(leaderboardId);

    console.log(`✅ Manual reset completed for: ${leaderboardId}\n`);
    return true;
  } catch (error) {
    console.error("❌ Error during manual reset:", error);
    throw error;
  }
}

/**
 * Set TTL on leaderboard entries
 */
async function setTTLOnLeaderboard(leaderboardId, ttlSeconds) {
  const redis = getRedisClient();
  const key = `leaderboard:${leaderboardId}`;

  try {
    await redis.expire(key, ttlSeconds);
    console.log(`⏱️  Set TTL ${ttlSeconds}s on ${key}`);
    return true;
  } catch (error) {
    console.error("Error setting TTL:", error);
    throw error;
  }
}

/**
 * Get TTL remaining on leaderboard
 */
async function getTTL(leaderboardId) {
  const redis = getRedisClient();
  const key = `leaderboard:${leaderboardId}`;

  try {
    const ttl = await redis.ttl(key);
    return ttl; // -1 if no expiry, -2 if key doesn't exist, positive number = seconds remaining
  } catch (error) {
    console.error("Error getting TTL:", error);
    throw error;
  }
}

module.exports = {
  scheduleDailyReset,
  manualReset,
  setTTLOnLeaderboard,
  getTTL,
};
