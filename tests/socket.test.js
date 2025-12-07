const io = require("socket.io-client");
const http = require("http");
const { Server } = require("socket.io");
const { setupSocketHandlers } = require("../src/socket/socketHandlers");

describe("Socket.IO Integration", () => {
  let httpServer;
  let ioServer;
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    httpServer = http.createServer();
    ioServer = new Server(httpServer);

    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = io(`http://localhost:${port}`);
      ioServer.on("connection", (socket) => {
        serverSocket = socket;
        setupSocketHandlers(socket, ioServer);
      });
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    ioServer.close();
    clientSocket.close();
    httpServer.close();
  });

  test("should connect successfully", () => {
    expect(clientSocket.connected).toBe(true);
  });

  test("should join leaderboard room", (done) => {
    clientSocket.emit("join-leaderboard", { leaderboardId: "test" });
    clientSocket.on("joined-leaderboard", (data) => {
      expect(data.leaderboardId).toBe("test");
      done();
    });
  });

  test("should handle missing leaderboardId", (done) => {
    clientSocket.emit("join-leaderboard", {});
    clientSocket.on("error", (error) => {
      expect(error.message).toContain("leaderboardId is required");
      done();
    });
  });

  test("should return falsy for nonexistent member", async () => {
    const key = "leaderboard:test";
    const result = await redis.eval(getUserScoreAndRankScript, 1, key, "nonexistent");
    expect(result).toBeFalsy(); // ioredis-mock returns undefined for missing member
  });
});

