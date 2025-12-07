const { buildLeaderboardKey, buildPubSubChannel, buildDateBasedKey, getWeekNumber } = require("../src/utils/keyBuilder");

describe("Key Builder Utils", () => {
  describe("buildLeaderboardKey", () => {
    test("should build correct leaderboard key", () => {
      expect(buildLeaderboardKey("daily")).toBe("leaderboard:daily");
      expect(buildLeaderboardKey("weekly")).toBe("leaderboard:weekly");
      expect(buildLeaderboardKey("alltime")).toBe("leaderboard:alltime");
    });
  });

  describe("buildPubSubChannel", () => {
    test("should build correct pub/sub channel", () => {
      expect(buildPubSubChannel("daily")).toBe("leaderboard:updates:daily");
      expect(buildPubSubChannel("weekly")).toBe("leaderboard:updates:weekly");
    });
  });

  describe("buildDateBasedKey", () => {
    test("should build daily key", () => {
      const date = new Date("2025-12-06");
      expect(buildDateBasedKey("daily", date)).toBe("leaderboard:daily:2025-12-06");
    });

    test("should build monthly key", () => {
      const date = new Date("2025-12-06");
      expect(buildDateBasedKey("monthly", date)).toBe("leaderboard:monthly:2025-12");
    });

    test("should build weekly key", () => {
      const date = new Date("2025-12-06");
      const result = buildDateBasedKey("weekly", date);
      expect(result).toMatch(/^leaderboard:weekly:2025-W\d{2}$/);
    });
  });

  describe("getWeekNumber", () => {
    test("should return correct week number", () => {
      const date = new Date("2025-01-01");
      const week = getWeekNumber(date);
      expect(week).toMatch(/^\d{2}$/);
    });
  });
});
