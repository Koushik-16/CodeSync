import { Server } from "socket.io";
import Session from "../models/session.model.js";
import CodeSnippet from "../models/code.model.js";
import * as Y from "yjs";
import { encode as base64Encode, decode as base64Decode } from 'base64-arraybuffer';

let io; // Socket.IO server instance

// In-memory Y.Doc store per session code
const sessionDocs = {};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Set to your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    /**
     * Join Session Logic
     */
    socket.on("join-session", async ({ sessionId, authUser }) => {
      try {
        // 1. Validate session
        const session = await Session.findOne({ sessionCode: sessionId });
        if (!session) {
          socket.emit("error", { message: "Session not found." });
          return;
        }

        socket.join(sessionId);
        console.log(`User ${authUser?._id || "unknown"} joined session: ${sessionId}`);

        // 2. Load or initialize Y.Doc for this session
        if (!sessionDocs[sessionId]) {
          const ydoc = new Y.Doc();

          try {
            const existingSnippet = await CodeSnippet.findOne({ sessionId: session._id });
            if (existingSnippet?.code?.update) {
              const update = base64Decode(existingSnippet.code.update);
              Y.applyUpdate(ydoc, new Uint8Array(update));
            }
          } catch (err) {
            console.error("Error loading code snippet:", err);
          }

          sessionDocs[sessionId] = { doc: ydoc };
        }

        const ydoc = sessionDocs[sessionId].doc;
        const update = Y.encodeStateAsUpdate(ydoc);

        // 3. Send current Y.Doc state to client
        socket.emit("yjs-update", Array.from(update));

        // 4. Listen for updates from this client and broadcast to others
        socket.on("yjs-update", (updateArray) => {
          try {
            const update = new Uint8Array(updateArray);
            Y.applyUpdate(ydoc, update);
            socket.to(sessionId).emit("yjs-update", updateArray);
          } catch (err) {
            console.error("Error applying Yjs update:", err);
            socket.emit("error", { message: "Failed to apply update." });
          }
        });

        // 5. Listen for save requests
        socket.on("save-document", async () => {
          try {
            const fullUpdate = Y.encodeStateAsUpdate(ydoc);
            const base64 = base64Encode(fullUpdate);

            await CodeSnippet.findOneAndUpdate(
              { sessionId: session._id },
              {
                code: { update: base64 },
                lastUpdated: new Date(),
              },
              { upsert: true }
            );
            console.log(`💾 Saved document for sessionId ${sessionId}`);
          } catch (err) {
            console.error("Error saving document:", err);
            socket.emit("error", { message: "Failed to save document." });
          }
        });

      } catch (err) {
        console.error("Error in join-session:", err);
        socket.emit("error", { message: "Internal server error in join-session." });
      }
    });

    /**
     * Disconnect Logic
     */
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // Optionally: Clean up sessionDocs if no users left in a session
    });

    // Global error handler for unexpected errors
    socket.on("error", (err) => {
      console.error("Socket error:", err);
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
