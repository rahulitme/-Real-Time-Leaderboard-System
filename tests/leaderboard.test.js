const Redis = require("ioredis-mock");
const { setIfGreaterScript, incrementScoreScript, setScoreScript, getUserScoreAndRankScript } = require("../src/utils/luaScripts");

describe("Leaderboard Lua Scripts", () => {
  let redis;

  beforeEach(() => {
    redis = new Redis();
  });

  afterEach(async () => {
    await redis.flushall();
    redis.disconnect();
  });

  describe("setIfGreaterScript", () => {
    test("should set score if greater than current", async () => {
      const key = "test:leaderboard";
      let result = await redis.eval(setIfGreaterScript, 1, key, "user1", 100);
      expect(result[0]).toBe(100);
      expect(result[1]).toBe(0);
      expect(result[2]).toBe(1);
      result = await redis.eval(setIfGreaterScript, 1, key, "user1", 150);
      expect(result[0]).toBe(150);
      expect(result[2]).toBe(1);
      result = await redis.eval(setIfGreaterScript, 1, key, "user1", 120);
      expect(result[0]).toBe(150);
      expect(result[2]).toBe(0);
    });
  });

  describe("incrementScoreScript", () => {
    test("should increment score correctly", async () => {
      const key = "test:leaderboard";
      let result = await redis.eval(incrementScoreScript, 1, key, "user1", 50);
      expect(result[0]).toBe(50);
      result = await redis.eval(incrementScoreScript, 1, key, "user1", 30);
      expect(result[0]).toBe(80);
    });
  });

  describe("setScoreScript", () => {
    test("should set score unconditionally", async () => {
      const key = "test:leaderboard";
      let result = await redis.eval(setScoreScript, 1, key, "user1", 100);
      expect(result[0]).toBe(100);
      result = await redis.eval(setScoreScript, 1, key, "user1", 50);
      expect(result[0]).toBe(50);
    });
  });

  describe("getUserScoreAndRankScript", () => {
    test("should return score and rank for existing user", async () => {
      const key = "test:leaderboard";
      await redis.zadd(key, 100, "user1");
      await redis.zadd(key, 200, "user2");
      const result = await redis.eval(getUserScoreAndRankScript, 1, key, "user1");
      expect(result[0]).toBe(100);
      expect(result[1]).toBe(1);
    });

    test("should return nil for non-existing user", async () => {
      const key = "test:leaderboard";
      const result = await redis.eval(getUserScoreAndRankScript, 1, key, "nonexistent");
      expect(result).toBeNull();
    });
  });
});
