import * as Y from "yjs";
import Session from "../../models/session.model.js";
import CodeSnippet from "../../models/code.model.js";
import { encode as base64Encode, decode as base64Decode } from "base64-arraybuffer";

// In-memory Y.Doc store per session code
const sessionDocs = {};

// Debounce map for saving documents
const savePendingDocs = new Map();
const SAVE_DEBOUNCE_MS = 2000; // Save after 2 seconds of inactivity

/**
 * Debounced save to database
 */
const debouncedSave = async (sessionCode, ydoc) => {
  // Clear existing timeout
  if (savePendingDocs.has(sessionCode)) {
    clearTimeout(savePendingDocs.get(sessionCode));
  }

  // Set new timeout
  const timeoutId = setTimeout(async () => {
    try {
      const session = await Session.findOne({ sessionCode }).lean();
      if (session) {
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
        console.log(`💾 Saved document for sessionId ${sessionCode}`);
      }
      savePendingDocs.delete(sessionCode);
    } catch (err) {
      console.error("Error saving document:", err);
    }
  }, SAVE_DEBOUNCE_MS);

  savePendingDocs.set(sessionCode, timeoutId);
};

/**
 * Handle Yjs collaborative editing events
 */
export const handleYjsEvents = (socket, io) => {
  /**
   * Join Session and Load Y.Doc
   */
  socket.on("join-session", async ({ sessionId, authUser }) => {
    try {
      // Validate session
      const session = await Session.findOne({ sessionCode: sessionId }).lean();
      if (!session) {
        socket.emit("error", { message: "Session not found." });
        return;
      }

      socket.join(sessionId);

      // Update participants if needed
      if (!session.participants.includes(authUser._id)) {
        await Session.findOneAndUpdate(
          { sessionCode: sessionId },
          { $addToSet: { participants: authUser._id } }
        );
      }

      // Load or initialize Y.Doc for this session
      if (!sessionDocs[sessionId]) {
        const ydoc = new Y.Doc();

        try {
          const existingSnippet = await CodeSnippet.findOne({
            sessionId: session._id,
          }).lean();
          
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

      // Send current Y.Doc state to client
      socket.emit("yjs-update", Array.from(update));

      // Listen for updates from this client and broadcast to others
      const updateHandler = (updateArray) => {
        try {
          const update = new Uint8Array(updateArray);
          Y.applyUpdate(ydoc, update);
          socket.to(sessionId).emit("yjs-update", updateArray);
          
          // Debounced save
          debouncedSave(sessionId, ydoc);
        } catch (err) {
          console.error("Error applying Yjs update:", err);
          socket.emit("error", { message: "Failed to apply update." });
        }
      };

      socket.on("yjs-update", updateHandler);

      // Manual save trigger
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
          socket.emit("document-saved");
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
};

/**
 * Clean up Y.Doc when session ends
 */
export const cleanupYjsSession = (sessionCode) => {
  if (sessionDocs[sessionCode]) {
    delete sessionDocs[sessionCode];
  }
  if (savePendingDocs.has(sessionCode)) {
    clearTimeout(savePendingDocs.get(sessionCode));
    savePendingDocs.delete(sessionCode);
  }
};
