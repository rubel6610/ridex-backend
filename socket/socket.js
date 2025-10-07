// socket/socket.js
const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // frontend domain দাও
      methods: ["GET", "POST"]
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ New socket connected:", socket.id);

    // ইউজার join করবে
    socket.on("register_user", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room user_${userId}`);
    });

    // এডমিন join করবে
    socket.on("register_admin", () => {
      socket.join("admins");
      console.log("🛡️ Admin joined admins room");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
