const leaderboardService = require('../services/leaderboardService');
const filterService = require('../services/filterService');
const cacheService = require('../services/cacheService');
const { queueScoreUpdate } = require('../services/persistenceService');
const { publishScoreUpdate } = require('../services/pubsubService');

function setupSocketHandlers(socket, io) {
  /**
   * Join a leaderboard room
   */
  socket.on('join-leaderboard', async (data) => {
    try {
      const { leaderboardId, region, gameMode } = data;
      if (!leaderboardId) {
        socket.emit('error', { message: 'leaderboardId is required' });
        return;
      }
      const room = `leaderboard:${leaderboardId}:${region || 'global'}:${gameMode || 'all'}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined ${room}`);
      socket.emit('joined-leaderboard', { leaderboardId, region, gameMode });
    } catch (error) {
      console.error('Error joining leaderboard:', error);
      socket.emit('error', { message: 'Failed to join leaderboard' });
    }
  });

  /**
   * Leave a leaderboard room
   */
  socket.on('leave-leaderboard', (data) => {
    try {
      const { leaderboardId, region, gameMode } = data;
      const room = `leaderboard:${leaderboardId}:${region || 'global'}:${gameMode || 'all'}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left ${room}`);
    } catch (error) {
      console.error('Error leaving leaderboard:', error);
    }
  });

  /**
   * Update player score with region/game mode
   */
  socket.on('update-score', async (data) => {
    try {
      const { leaderboardId, userId, score, username, region, gameMode, mode = 'set-if-greater' } = data;
      
      if (!leaderboardId || !userId || score === undefined) {
        socket.emit('error', { message: 'leaderboardId, userId, and score are required' });
        return;
      }

      let result;

      // Update with filtering
      if (region || gameMode) {
        result = await filterService.updateScoreFiltered(
          leaderboardId,
          userId,
          score,
          username,
          region,
          gameMode
        );
      } else {
        // Standard update
        switch (mode) {
          case 'increment':
            result = await leaderboardService.incrementScore(leaderboardId, userId, score, username);
            break;
          case 'set':
            result = await leaderboardService.setScore(leaderboardId, userId, score, username);
            break;
          case 'set-if-greater':
          default:
            result = await leaderboardService.updateScore(leaderboardId, userId, score, username);
            break;
        }
      }

      // Queue for persistence
      queueScoreUpdate(leaderboardId, userId, result.score, username);

      // Invalidate cache
      await cacheService.invalidateLeaderboardCache(leaderboardId, region, gameMode);

      // Publish update
      await publishScoreUpdate(leaderboardId, { ...result, leaderboardId, region, gameMode });

      // Emit to player
      socket.emit('score-updated', { ...result, leaderboardId });

      // Broadcast to leaderboard room
      const room = `leaderboard:${leaderboardId}:${region || 'global'}:${gameMode || 'all'}`;
      io.to(room).emit('score-updated', { ...result, leaderboardId });
    } catch (error) {
      console.error('Error updating score:', error);
      socket.emit('error', { message: 'Failed to update score' });
    }
  });

  /**
   * Get top scores (with optional filtering and caching)
   */
  socket.on('get-top-scores', async (data) => {
    try {
      const { leaderboardId, limit = 10, region, gameMode } = data;

      if (!leaderboardId) {
        socket.emit('error', { message: 'leaderboardId is required' });
        return;
      }

      // Try cache first
      let scores = await cacheService.getTopScoresFromCache(leaderboardId, limit, region, gameMode);

      if (!scores) {
        // Get from database
        if (region || gameMode) {
          scores = await filterService.getTopScoresFiltered(leaderboardId, limit, region, gameMode);
        } else {
          scores = await leaderboardService.getTopScores(leaderboardId, limit);
        }

        // Cache the results
        await cacheService.cacheTopScores(leaderboardId, scores, limit, region, gameMode);
      }

      socket.emit('top-scores', {
        leaderboardId,
        scores,
        region,
        gameMode,
        cached: !!scores,
      });
    } catch (error) {
      console.error('Error getting top scores:', error);
      socket.emit('error', { message: 'Failed to get top scores' });
    }
  });

  /**
   * Get user rank (with optional filtering)
   */
  socket.on('get-user-rank', async (data) => {
    try {
      const { leaderboardId, userId, region, gameMode } = data;

      if (!leaderboardId || !userId) {
        socket.emit('error', { message: 'leaderboardId and userId are required' });
        return;
      }

      let result;
      if (region || gameMode) {
        result = await filterService.getUserRankFiltered(leaderboardId, userId, region, gameMode);
      } else {
        result = await leaderboardService.getUserRank(leaderboardId, userId);
      }

      socket.emit('user-rank', {
        leaderboardId,
        ...result,
      });
    } catch (error) {
      console.error('Error getting user rank:', error);
      socket.emit('error', { message: 'Failed to get user rank' });
    }
  });

  /**
   * Get scores around user
   */
  socket.on('get-scores-around-user', async (data) => {
    try {
      const { leaderboardId, userId, range = 5 } = data;

      if (!leaderboardId || !userId) {
        socket.emit('error', { message: 'leaderboardId and userId are required' });
        return;
      }

      const scores = await leaderboardService.getScoresAroundUser(leaderboardId, userId, range);

      socket.emit('scores-around-user', {
        leaderboardId,
        userId,
        scores,
      });
    } catch (error) {
      console.error('Error getting scores around user:', error);
      socket.emit('error', { message: 'Failed to get scores around user' });
    }
  });

  /**
   * Get leaderboard size (with optional filtering)
   */
  socket.on('get-leaderboard-size', async (data) => {
    try {
      const { leaderboardId, region, gameMode } = data;

      if (!leaderboardId) {
        socket.emit('error', { message: 'leaderboardId is required' });
        return;
      }

      const size = await leaderboardService.getLeaderboardSize(leaderboardId);

      socket.emit('leaderboard-size', {
        leaderboardId,
        size,
        region,
        gameMode,
      });
    } catch (error) {
      console.error('Error getting leaderboard size:', error);
      socket.emit('error', { message: 'Failed to get leaderboard size' });
    }
  });

  /**
   * Get leaderboard statistics
   */
  socket.on('get-leaderboard-stats', async (data) => {
    try {
      const { leaderboardId, region, gameMode } = data;

      if (!leaderboardId) {
        socket.emit('error', { message: 'leaderboardId is required' });
        return;
      }

      const stats = await filterService.getLeaderboardStats(leaderboardId, region, gameMode);

      socket.emit('leaderboard-stats', stats);
    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      socket.emit('error', { message: 'Failed to get leaderboard stats' });
    }
  });

  /**
   * Get cache statistics
   */
  socket.on('get-cache-stats', async (data) => {
    try {
      const stats = await cacheService.getCacheStats();
      socket.emit('cache-stats', stats);
    } catch (error) {
      console.error('Error getting cache stats:', error);
      socket.emit('error', { message: 'Failed to get cache stats' });
    }
  });
}

module.exports = {
  setupSocketHandlers,
};
