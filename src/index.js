require("dotenv").config();
const express = require("express");
const http = require("http");
const { initSocketServer } = require("./socket/socketServer");
const { connectRedis } = require("./config/redis");
const { connectMongo } = require("./config/mongo");
const { startBatchProcessor } = require("./services/persistenceService");
const { subscribeToPubSub } = require("./services/pubsubService");
const { scheduleDailyReset } = require("./cron/dailyReset");
const config = require("./config/env");

class LeaderboardServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = null;
  }

  setupMiddleware() {
    this.app.use(express.json());
  }

  setupRoutes() {
    this.app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    this.app.get("/", (req, res) => {
      res.json({
        message: "Real-time Leaderboard API",
        version: "1.0.0",
        endpoints: { health: "/health", socket: `ws://localhost:${config.PORT}` },
      });
    });
  }

  async initialize() {
    console.log("Initializing Real-time Leaderboard Server...\n");

    console.log("Connecting to Redis...");
    await connectRedis();
    console.log("? Redis connected");

    console.log("Connecting to MongoDB...");
    await connectMongo();
    console.log("? MongoDB connected");

    this.setupMiddleware();
    this.setupRoutes();

    console.log("Initializing Socket.IO...");
    this.io = initSocketServer(this.server);
    console.log(" Socket.IO initialized");

    console.log("Setting up Pub/Sub...");
    await subscribeToPubSub(this.io);
    console.log(" Pub/Sub ready");

    console.log("Starting batch processor...");
    startBatchProcessor();
    console.log(" Batch processor started");

    if (config.DAILY_RESET_ENABLED) {
      scheduleDailyReset();
    }
  }

  start() {
    this.server.listen(config.PORT, () => {
      console.log(`\n Server running on port ${config.PORT}`);
      console.log(`   Environment: ${config.NODE_ENV}`);
      console.log(`   Socket.IO: ws://localhost:${config.PORT}`);
      console.log(`   Health: http://localhost:${config.PORT}/health\n`);
    });
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      console.log("\nShutting down gracefully...");
      this.server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  }
}

if (require.main === module) {
  const server = new LeaderboardServer();
  (async () => {
    try {
      await server.initialize();
      server.start();
      server.setupGracefulShutdown();
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  })();
}

module.exports = LeaderboardServer;
