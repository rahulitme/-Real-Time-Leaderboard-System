const { getScoresCollection } = require("../config/mongo");
const config = require("../config/env");

const updateQueue = new Map();
let batchTimer = null;

function queueScoreUpdate(leaderboardId, userId, score, username = null) {
  const key = `${leaderboardId}:${userId}`;
  updateQueue.set(key, { leaderboardId, userId, score, username, timestamp: new Date() });
  if (updateQueue.size >= config.BATCH_SIZE) {
    flushQueue();
  }
}

async function flushQueue() {
  if (updateQueue.size === 0) return;
  const updates = Array.from(updateQueue.values());
  updateQueue.clear();
  try {
    const collection = getScoresCollection();
    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { leaderboardId: u.leaderboardId, userId: u.userId },
        update: {
          $set: { score: u.score, username: u.username, updatedAt: u.timestamp },
          $setOnInsert: { createdAt: u.timestamp },
        },
        upsert: true,
      },
    }));
    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps, { ordered: false });
      console.log(` Persisted ${bulkOps.length} score updates to MongoDB`);
    }
  } catch (error) {
    console.error("Error persisting scores to MongoDB:", error);
    updates.forEach((u) => updateQueue.set(`${u.leaderboardId}:${u.userId}`, u));
  }
}

function startBatchProcessor() {
  if (batchTimer) clearInterval(batchTimer);
  batchTimer = setInterval(async () => { await flushQueue(); }, config.BATCH_INTERVAL_MS);
  console.log(`Batch processor started (interval: ${config.BATCH_INTERVAL_MS}ms)`);
}

async function stopBatchProcessor() {
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
  await flushQueue();
  console.log("Batch processor stopped");
}

async function getPersistedScore(leaderboardId, userId) {
  const collection = getScoresCollection();
  return await collection.findOne({ leaderboardId, userId });
}

async function getPersistedTopScores(leaderboardId, limit = 10) {
  const collection = getScoresCollection();
  return await collection.find({ leaderboardId }).sort({ score: -1 }).limit(limit).toArray();
}

module.exports = { queueScoreUpdate, flushQueue, startBatchProcessor, stopBatchProcessor, getPersistedScore, getPersistedTopScores };
