require("dotenv").config();
const express = require("express");
const http = require("http");
const { initSocketServer } = require("./src/socket/socketServer");
const { connectRedis } = require("./src/config/redis");
const { connectMongo } = require("./src/config/mongo");
const { startBatchProcessor } = require("./src/services/persistenceService");
const { subscribeToPubSub } = require("./src/services/pubsubService");
const config = require("./src/config/env");

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({
    message: "Real-time Leaderboard API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      socket: "ws://localhost:" + config.PORT,
    },
  });
});

async function start() {
  try {
    console.log("Connecting to Redis...");
    await connectRedis();
    console.log(" Redis connected");

    console.log("Connecting to MongoDB...");
    await connectMongo();
    console.log("? MongoDB connected");

    console.log("Initializing Socket.IO...");
    const io = initSocketServer(server);
    console.log("? Socket.IO initialized");

    console.log("Setting up Pub/Sub...");
    await subscribeToPubSub(io);
    console.log("? Pub/Sub ready");

    console.log("Starting batch processor...");
    startBatchProcessor();
    console.log(" Batch processor started");

    server.listen(config.PORT, () => {
      console.log(`\n Server running on port ${config.PORT}`);
      console.log(`   Environment: ${config.NODE_ENV}`);
      console.log(`   Socket.IO: ws://localhost:${config.PORT}`);
      console.log(`   Health: http://localhost:${config.PORT}/health\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  console.log("\nSIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

start();
