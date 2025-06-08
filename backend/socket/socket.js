import { Server } from "socket.io";
import Session from "../models/session.model.js";
import CodeSnippet from "../models/code.model.js";
import User from "../models/user.model.js";
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

        if (!session.participants.includes(authUser._id)) {
          session.participants.push(authUser._id);
          await session.save();
         // console.log("User added to session");

        } else {
          //console.log("User already a part of the session");
        }



        const socketsInRoom = await io.in(sessionId).fetchSockets();
         if(socketsInRoom.length === 2) {

       const host = await User.findById(session.host)
      // console.log("Host User", host._id.toString());
       const otherId = session.participants.filter((id) => id !== session.host.toString());
       const otherUser = await User.findById(otherId).select('-password');
      //console.log("Other User", otherUser);
    
    //  console.log("Sockets in room:", socketsInRoom.map(s => s.id));
      const otherSocket = socketsInRoom.find(s => s.id !== socket.id);
    
       if(authUser._id.toString() === host._id.toString()) {
        socket.broadcast.to(sessionId).emit("user-connected" , {remoteUser : host.username ,  remoteSocketId : socket.id});
        socket.emit("user-connected" , {remoteUser :otherUser.username  , remoteSocketId : otherSocket?.id});
       }else {
       
       socket.broadcast.to(sessionId).emit("user-connected" , {remoteUser : otherUser.username ,  remoteSocketId : socket.id});
       socket.emit("user-connected" , {remoteUser :host.username  , remoteSocketId : otherSocket?.id});
       }

       }




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
            // console.log(`💾 Saved document for sessionId ${sessionId}`);
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


    socket.on('change-language', async ({ sessionId, language }) => {
  // Broadcast to others
 try {
    socket.to(sessionId).emit('language-changed', { language });

    const session = await Session.findOne({ sessionCode: sessionId });
    if (!session) return;

    await CodeSnippet.findOneAndUpdate(
      { sessionId: session._id },
      { language },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error saving language:", err);
  }
});

socket.on('get-language', async ({ sessionId }, callback) => {
  try {
    const session = await Session.findOne({ sessionCode: sessionId });
    if (!session) return callback(null);

    const snippet = await CodeSnippet.findOne({ sessionId: session._id });
    if (snippet?.language) {
      callback(snippet.language);
    } else {
      callback('javascript'); // default fallback
    }
  } catch (err) {
    console.error("Error getting language:", err);
    callback(null);
  }
});


socket.on('clear-code', async ({ sessionId }) => {
  // Clear Yjs doc in memory
  const session = sessionDocs[sessionId];
  if (session && session.doc) {
    const yText = session.doc.getText('monaco');
    yText.delete(0, yText.length);

    // Save empty code to DB
    try {
      const SessionModel = await Session.findOne({ sessionCode: sessionId });
      if (SessionModel) {
        const fullUpdate = Y.encodeStateAsUpdate(session.doc);
        const base64 = base64Encode(fullUpdate);
        await CodeSnippet.findOneAndUpdate(
          { sessionId: SessionModel._id },
          { code: { update: base64 }, lastUpdated: new Date() },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error('Error clearing code in DB:', err);
    }
  }

  // Notify all clients to clear code
  io.to(sessionId).emit('clear-code');
});



  socket.on("code-output" , ({ sessionId, output , hasError }) => {
   console.log(hasError, "hasError");
      socket.to(sessionId).emit("code-output", { output , hasError});
  });


    /**
     * Disconnect Logic
     */
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // Optionally: Clean up sessionDocs if no users left in a session
      socket.rooms.forEach((room) => {
    // Skip the socket's own room
    if (room === socket.id) return;

    // Check if the room is now empty
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    if (roomSize === 0) {
      delete sessionDocs[room];
      console.log(`Deleted sessionDocs for session ${room} (room is empty)`);
    }
  });
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
