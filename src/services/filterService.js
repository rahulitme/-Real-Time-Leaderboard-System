const { getRedisClient } = require('../config/redis');

/**
 * Build filtered leaderboard key
 */
function buildFilteredKey(leaderboardId, region = null, gameMode = null) {
  let key = `leaderboard:${leaderboardId}`;
  if (region) key += `:region:${region}`;
  if (gameMode) key += `:mode:${gameMode}`;
  return key;
}

/**
 * Get top N scores filtered by region/game mode
 */
async function getTopScoresFiltered(leaderboardId, limit = 10, region = null, gameMode = null) {
  const redis = getRedisClient();
  const key = buildFilteredKey(leaderboardId, region, gameMode);

  const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
  const scores = [];
  
  for (let i = 0; i < results.length; i += 2) {
    scores.push({
      userId: results[i],
      score: parseFloat(results[i + 1]),
      rank: Math.floor(i / 2) + 1,
      region,
      gameMode,
    });
  }

  return scores;
}

/**
 * Get user rank filtered by region/game mode
 */
async function getUserRankFiltered(leaderboardId, userId, region = null, gameMode = null) {
  const redis = getRedisClient();
  const key = buildFilteredKey(leaderboardId, region, gameMode);

  const score = await redis.zscore(key, userId);
  if (score === null) return null;

  const rank = await redis.zrevrank(key, userId);
  return {
    userId,
    score: parseFloat(score),
    rank: rank + 1,
    region,
    gameMode,
  };
}

/**
 * Update score with region/game mode filtering
 */
async function updateScoreFiltered(leaderboardId, userId, score, username = null, region = null, gameMode = null) {
  const redis = getRedisClient();
  
  // Update global leaderboard
  const globalKey = buildFilteredKey(leaderboardId);
  await redis.zadd(globalKey, score, userId);

  // Update region-specific leaderboard
  if (region) {
    const regionKey = buildFilteredKey(leaderboardId, region);
    await redis.zadd(regionKey, score, userId);
  }

  // Update game mode-specific leaderboard
  if (gameMode) {
    const modeKey = buildFilteredKey(leaderboardId, null, gameMode);
    await redis.zadd(modeKey, score, userId);
  }

  // Update region + game mode leaderboard
  if (region && gameMode) {
    const filteredKey = buildFilteredKey(leaderboardId, region, gameMode);
    await redis.zadd(filteredKey, score, userId);
  }

  const globalRank = await redis.zrevrank(globalKey, userId);
  
  return {
    userId,
    score,
    rank: globalRank + 1,
    username,
    region,
    gameMode,
  };
}

/**
 * Get leaderboard statistics
 */
async function getLeaderboardStats(leaderboardId, region = null, gameMode = null) {
  const redis = getRedisClient();
  const key = buildFilteredKey(leaderboardId, region, gameMode);

  const count = await redis.zcard(key);
  const topScore = await redis.zrevrange(key, 0, 0, 'WITHSCORES');
  const bottomScore = await redis.zrange(key, 0, 0, 'WITHSCORES');

  return {
    totalPlayers: count,
    topScore: topScore.length > 0 ? parseFloat(topScore[1]) : 0,
    bottomScore: bottomScore.length > 0 ? parseFloat(bottomScore[1]) : 0,
    leaderboardId,
    region,
    gameMode,
  };
}

module.exports = {
  buildFilteredKey,
  getTopScoresFiltered,
  getUserRankFiltered,
  updateScoreFiltered,
  getLeaderboardStats,
};