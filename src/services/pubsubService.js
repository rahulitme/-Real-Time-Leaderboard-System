const { getRedisPubClient, getRedisSubClient } = require("../config/redis");
const { buildPubSubChannel } = require("../utils/keyBuilder");

async function publishScoreUpdate(leaderboardId, data) {
  const pubClient = getRedisPubClient();
  const channel = buildPubSubChannel(leaderboardId);
  await pubClient.publish(channel, JSON.stringify(data));
}

async function subscribeToPubSub(io) {
  const subClient = getRedisSubClient();
  await subClient.psubscribe("leaderboard:updates:*");
  subClient.on("pmessage", (pattern, channel, message) => {
    try {
      const data = JSON.parse(message);
      const leaderboardId = data.leaderboardId;
      io.to(`leaderboard:${leaderboardId}`).emit("score-updated", data);
    } catch (error) {
      console.error("Error processing pub/sub message:", error);
    }
  });
  console.log("Subscribed to leaderboard updates via Pub/Sub");
}

async function publishLeaderboardReset(leaderboardId) {
  const pubClient = getRedisPubClient();
  const channel = buildPubSubChannel(leaderboardId);
  await pubClient.publish(channel, JSON.stringify({ type: "reset", leaderboardId, timestamp: new Date().toISOString() }));
}

module.exports = { publishScoreUpdate, subscribeToPubSub, publishLeaderboardReset };
