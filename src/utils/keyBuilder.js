function buildLeaderboardKey(leaderboardId) {
  return `leaderboard:${leaderboardId}`;
}

function buildPubSubChannel(leaderboardId) {
  return `leaderboard:updates:${leaderboardId}`;
}

function buildDateBasedKey(type, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  switch (type) {
    case "daily":
      return `leaderboard:daily:${year}-${month}-${day}`;
    case "weekly":
      const week = getWeekNumber(date);
      return `leaderboard:weekly:${year}-W${week}`;
    case "monthly":
      return `leaderboard:monthly:${year}-${month}`;
    default:
      return buildLeaderboardKey(type);
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return String(weekNo).padStart(2, "0");
}

module.exports = { buildLeaderboardKey, buildPubSubChannel, buildDateBasedKey, getWeekNumber };
