const { Server } = require("socket.io");
const { setupSocketHandlers } = require("./socketHandlers");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    setupSocketHandlers(socket, io);
    socket.on("disconnect", () => console.log(`Client disconnected: ${socket.id}`));
  });

  return io;
}

module.exports = { initSocketServer };
