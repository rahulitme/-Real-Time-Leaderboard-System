const setIfGreaterScript = `
  local key = KEYS[1]
  local userId = ARGV[1]
  local newScore = tonumber(ARGV[2])
  local currentScore = redis.call("ZSCORE", key, userId)
  if not currentScore or newScore > tonumber(currentScore) then
    redis.call("ZADD", key, newScore, userId)
    local rank = redis.call("ZREVRANK", key, userId)
    return {newScore, rank, 1}
  else
    local rank = redis.call("ZREVRANK", key, userId)
    return {tonumber(currentScore), rank, 0}
  end
`;

const incrementScoreScript = `
  local key = KEYS[1]
  local userId = ARGV[1]
  local increment = tonumber(ARGV[2])
  local newScore = redis.call("ZINCRBY", key, increment, userId)
  local rank = redis.call("ZREVRANK", key, userId)
  return {tonumber(newScore), rank}
`;

const setScoreScript = `
  local key = KEYS[1]
  local userId = ARGV[1]
  local score = tonumber(ARGV[2])
  redis.call("ZADD", key, score, userId)
  local rank = redis.call("ZREVRANK", key, userId)
  return {score, rank}
`;

const getUserScoreAndRankScript = `
  local key = KEYS[1]
  local userId = ARGV[1]
  local score = redis.call("ZSCORE", key, userId)
  if not score then return nil end
  local rank = redis.call("ZREVRANK", key, userId)
  return {tonumber(score), rank}
`;

module.exports = { setIfGreaterScript, incrementScoreScript, setScoreScript, getUserScoreAndRankScript };
