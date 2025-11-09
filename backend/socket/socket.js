import { Server } from "socket.io";
import { handleSessionEvents } from "./handlers/sessionHandler.js";
import { handleYjsEvents } from "./handlers/yjsHandler.js";
import { handleWebRTCEvents } from "./handlers/webrtcHandler.js";
import { handleCodeEvents } from "./handlers/codeHandler.js";

let io; // Socket.IO server instance

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
    // Performance optimizations
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
    allowUpgrades: true,
    perMessageDeflate: {
      threshold: 1024, // Only compress messages > 1KB
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Register all event handlers
    handleSessionEvents(socket, io);
    handleYjsEvents(socket, io);
    handleWebRTCEvents(socket, io);
    handleCodeEvents(socket, io);

    // Global error handler
    socket.on("error", (err) => {
      console.error(`Socket error for ${socket.id}:`, err);
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ User disconnected: ${socket.id}, Reason: ${reason}`);
    });
  });

  return io;
};

const getSocketInstance = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized. Call initializeSocket first.");
  }
  return io;
};

export { initializeSocket, getSocketInstance };
