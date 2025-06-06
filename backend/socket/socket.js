import { Server } from "socket.io";
import User from "../models/user.model.js";

let io; // Variable to hold the Socket.IO server instance

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Replace with your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  


  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);



   
    /**
     * Disconnect Logic
     */
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
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