import Session from "../../models/session.model.js";
import CodeSnippet from "../../models/code.model.js";

/**
 * Handle code execution and language change events
 */
export const handleCodeEvents = (socket, io) => {
  /**
   * Change language
   */
  socket.on("change-language", async ({ sessionId, language }) => {
    try {
      // Broadcast to others
      socket.to(sessionId).emit("language-changed", { language });

      const session = await Session.findOne({ sessionCode: sessionId }).lean();
      if (session) {
        await CodeSnippet.findOneAndUpdate(
          { sessionId: session._id },
          { language },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error("Error changing language:", err);
    }
  });

  /**
   * Get current language
   */
  socket.on("get-language", async ({ sessionId }, callback) => {
    try {
      const session = await Session.findOne({ sessionCode: sessionId }).lean();
      if (session) {
        const snippet = await CodeSnippet.findOne({ sessionId: session._id })
          .select("language")
          .lean();
        
        if (callback) {
          callback(snippet?.language || "javascript");
        }
      } else {
        if (callback) {
          callback("javascript");
        }
      }
    } catch (err) {
      console.error("Error getting language:", err);
      if (callback) {
        callback("javascript");
      }
    }
  });

  /**
   * Clear code
   */
  socket.on("clear-code", ({ sessionId }) => {
    socket.to(sessionId).emit("clear-code");
  });

  /**
   * Code output
   */
  socket.on("code-output", ({ sessionId, output, hasError }) => {
    socket.to(sessionId).emit("code-output", { output, hasError });
  });
};
