const io = require('socket.io-client');

const socket = io('http://localhost:3000');
const leaderboardId = 'daily';

socket.on('connect', () => {
  console.log('\n✓ Connected to server\n');
  socket.emit('join-leaderboard', { leaderboardId });
  
  // Get top scores immediately
  setTimeout(() => {
    console.log('\n--- Fetching Top 10 Scores ---');
    socket.emit('get-top-scores', { leaderboardId, limit: 10 });
  }, 500);
});

socket.on('joined-leaderboard', (data) => {
  console.log(`✓ Joined leaderboard: ${data.leaderboardId}\n`);
});

socket.on('top-scores', (data) => {
  console.log('\n📊 LEADERBOARD:');
  console.log('─'.repeat(50));
  if (data.scores.length === 0) {
    console.log('No scores yet');
  } else {
    data.scores.forEach(s => {
      console.log(`${String(s.rank).padEnd(3)} | ${String(s.username || 'N/A').padEnd(15)} | Score: ${String(s.score).padStart(6)} | User: ${s.userId}`);
    });
  }
  console.log('─'.repeat(50));
});

socket.on('score-updated', (data) => {
  console.log(`\n✓ Score Updated: ${data.username} (ID: ${data.userId}) → Score: ${data.score}, Rank: ${data.rank}`);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

socket.on('disconnect', () => {
  console.log('\n✗ Disconnected from server');
  process.exit(0);
});

// Update scores from command line
function updateScoreDemo() {
  const users = [
    { userId: 'user1', username: 'Alice', score: 500 },
    { userId: 'user2', username: 'Bob', score: 750 },
    { userId: 'user3', username: 'Charlie', score: 620 },
    { userId: 'user4', username: 'Diana', score: 890 },
    { userId: 'user5', username: 'Eve', score: 450 },
  ];

  let index = 0;
  const interval = setInterval(() => {
    if (index < users.length) {
      const user = users[index];
      socket.emit('update-score', {
        leaderboardId,
        userId: user.userId,
        username: user.username,
        score: user.score,
        mode: 'set'
      });
      index++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        console.log('\n--- Final Leaderboard ---');
        socket.emit('get-top-scores', { leaderboardId, limit: 10 });
        setTimeout(() => process.exit(0), 2000);
      }, 1000);
    }
  }, 800);
}

// Start demo after connection
setTimeout(updateScoreDemo, 1000);