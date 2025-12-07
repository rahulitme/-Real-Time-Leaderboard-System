const { getRedisClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'cache:';

/**
 * Get cached top scores
 */
async function getTopScoresFromCache(leaderboardId, limit = 10, region = null, gameMode = null) {
  const redis = getRedisClient();
  const cacheKey = buildCacheKey('top-scores', leaderboardId, region, gameMode, limit);

  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`✓ Cache hit: ${cacheKey}`);
    return JSON.parse(cached);
  }

  return null;
}

/**
 * Cache top scores
 */
async function cacheTopScores(leaderboardId, scores, limit = 10, region = null, gameMode = null) {
  const redis = getRedisClient();
  const cacheKey = buildCacheKey('top-scores', leaderboardId, region, gameMode, limit);

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(scores));
  console.log(`📌 Cached: ${cacheKey} (TTL: ${CACHE_TTL}s)`);
}

/**
 * Invalidate cache for a leaderboard
 */
async function invalidateLeaderboardCache(leaderboardId, region = null, gameMode = null) {
  const redis = getRedisClient();
  const pattern = buildCacheKeyPattern(leaderboardId, region, gameMode);

  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`🗑️  Invalidated ${keys.length} cache entries for ${leaderboardId}`);
  }
}

/**
 * Build cache key
 */
function buildCacheKey(type, leaderboardId, region = null, gameMode = null, limit = null) {
  let key = `${CACHE_PREFIX}${type}:${leaderboardId}`;
  if (region) key += `:${region}`;
  if (gameMode) key += `:${gameMode}`;
  if (limit) key += `:${limit}`;
  return key;
}

/**
 * Build cache key pattern for invalidation
 */
function buildCacheKeyPattern(leaderboardId, region = null, gameMode = null) {
  let pattern = `${CACHE_PREFIX}*:${leaderboardId}`;
  if (region) pattern += `:${region}`;
  if (gameMode) pattern += `:${gameMode}`;
  pattern += '*';
  return pattern;
}

/**
 * Get cache stats
 */
async function getCacheStats() {
  const redis = getRedisClient();
  const keys = await redis.keys(`${CACHE_PREFIX}*`);
  return {
    cachedItems: keys.length,
    keys: keys,
  };
}

module.exports = {
  getTopScoresFromCache,
  cacheTopScores,
  invalidateLeaderboardCache,
  buildCacheKey,
  getCacheStats,
};