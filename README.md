# Real-Time Leaderboard System

A high-performance, scalable real-time leaderboard system built with **Node.js**, **Redis**, **MongoDB**, and **Socket.IO**. Supports player score updates, instant ranking, region/game mode filtering, and persistent storage.

## Features

✅ **Real-time Updates** - Instant leaderboard updates via WebSocket (Socket.IO)  
✅ **High Performance** - Redis sorted sets for O(log N) operations  
✅ **Atomic Operations** - Lua scripts prevent race conditions  
✅ **Persistent Storage** - MongoDB for score history and recovery  
✅ **Batch Processing** - Efficient bulk writes to MongoDB (5s intervals)  
✅ **Multi-dimensional Filtering** - Region and game mode support  
✅ **Caching Layer** - 5-minute TTL on top scores  
✅ **Pub/Sub Architecture** - Multi-instance support via Redis Pub/Sub  
✅ **Daily Reset** - Optional automated leaderboard resets  
✅ **Production Ready** - Graceful shutdown, error handling, logging  

## Architecture

### Tech Stack

| Component | Purpose |
|-----------|---------|
| **Node.js + Express** | API server & WebSocket |
| **Socket.IO** | Real-time bidirectional communication |
| **Redis** | In-memory leaderboard storage (sorted sets) |
| **MongoDB** | Persistent score history |
| **node-cron** | Scheduled daily resets |

### Data Flow
