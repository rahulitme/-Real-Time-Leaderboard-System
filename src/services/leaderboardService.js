const { getRedisClient } = require("../config/redis");
const { buildLeaderboardKey } = require("../utils/keyBuilder");
const { setIfGreaterScript, incrementScoreScript, setScoreScript, getUserScoreAndRankScript } = require("../utils/luaScripts");

async function updateScore(leaderboardId, userId, score, username = null) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  const result = await redis.eval(setIfGreaterScript, 1, key, userId, score);
  const [finalScore, rank, isNewBest] = result;
  return { userId, score: finalScore, rank: rank + 1, isNewBest: isNewBest === 1, username };
}

async function incrementScore(leaderboardId, userId, increment, username = null) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  const result = await redis.eval(incrementScoreScript, 1, key, userId, increment);
  const [score, rank] = result;
  return { userId, score, rank: rank + 1, username };
}

async function setScore(leaderboardId, userId, score, username = null) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  const result = await redis.eval(setScoreScript, 1, key, userId, score);
  const [finalScore, rank] = result;
  return { userId, score: finalScore, rank: rank + 1, username };
}

async function getTopScores(leaderboardId, limit = 10) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  const results = await redis.zrevrange(key, 0, limit - 1, "WITHSCORES");
  const scores = [];
  for (let i = 0; i < results.length; i += 2) {
    scores.push({ userId: results[i], score: parseFloat(results[i + 1]), rank: Math.floor(i / 2) + 1 });
  }
  return scores;
}

async function getUserRank(leaderboardId, userId) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  const result = await redis.eval(getUserScoreAndRankScript, 1, key, userId);
  if (!result) return null;
  const [score, rank] = result;
  return { userId, score, rank: rank + 1 };
}

async function getScoresAroundUser(leaderboardId, userId, range = 5) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  const rank = await redis.zrevrank(key, userId);
  if (rank === null) return [];
  const start = Math.max(0, rank - range);
  const end = rank + range;
  const results = await redis.zrevrange(key, start, end, "WITHSCORES");
  const scores = [];
  for (let i = 0; i < results.length; i += 2) {
    scores.push({ userId: results[i], score: parseFloat(results[i + 1]), rank: start + Math.floor(i / 2) + 1 });
  }
  return scores;
}

async function getLeaderboardSize(leaderboardId) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  return await redis.zcard(key);
}

async function removeUser(leaderboardId, userId) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  return await redis.zrem(key, userId);
}

async function clearLeaderboard(leaderboardId) {
  const redis = getRedisClient();
  const key = buildLeaderboardKey(leaderboardId);
  return await redis.del(key);
}

module.exports = { updateScore, incrementScore, setScore, getTopScores, getUserRank, getScoresAroundUser, getLeaderboardSize, removeUser, clearLeaderboard };
