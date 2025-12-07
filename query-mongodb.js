require('dotenv').config();
const { connectMongo, getScoresCollection } = require('./src/config/mongo');

async function queryMongoDB() {
  try {
    await connectMongo();
    const collection = getScoresCollection();

    console.log('\n MongoDB Leaderboard Data\n');

    // Top scores
    const topScores = await collection
      .find({ leaderboardId: 'daily' })
      .sort({ score: -1 })
      .limit(10)
      .toArray();

    console.log(' Top 10 Scores:');
    console.log(''.repeat(60));
    topScores.forEach((doc, idx) => {
      console.log(`${idx + 1}. ${doc.username} (${doc.userId}) - Score: ${doc.score}`);
    });

    // Statistics
    const stats = await collection.aggregate([
      { $match: { leaderboardId: 'daily' } },
      {
        $group: {
          _id: '$leaderboardId',
          totalPlayers: { $sum: 1 },
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
          minScore: { $min: '$score' },
        },
      },
    ]).toArray();

    console.log('\n Statistics:');
    console.log(''.repeat(60));
    if (stats.length > 0) {
      const s = stats[0];
      console.log(`Total Players: ${s.totalPlayers}`);
      console.log(`Average Score: ${Math.round(s.avgScore)}`);
      console.log(`Highest Score: ${s.maxScore}`);
      console.log(`Lowest Score: ${s.minScore}`);
    } else {
      console.log('No data yet');
    }

    // Recent updates
    const recent = await collection
      .find({ leaderboardId: 'daily' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    console.log('\n  Recent Updates:');
    console.log(''.repeat(60));
    if (recent.length > 0) {
      recent.forEach((doc) => {
        console.log(`${doc.username}: ${doc.score} (${doc.updatedAt.toISOString()})`);
      });
    } else {
      console.log('No updates yet');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

queryMongoDB();
