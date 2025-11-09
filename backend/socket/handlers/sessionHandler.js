import Session from "../../models/session.model.js";
import User from "../../models/user.model.js";

/**
 * Handle session-related socket events
 */
export const handleSessionEvents = (socket, io) => {
  /**
   * Join Session Logic
   */
  socket.on("joinSession", async ({ code, authUser, isHost, socketId }) => {
    try {
      const session = await Session.findOne({ sessionCode: code }).lean();
      
      if (!session) {
        socket.emit("error", { message: "Session not found." });
        return;
      }

      socket.join(code);
      console.log(`✅ User ${authUser.name} joined session: ${code}`);

      // Update participants if not already in the session
      const myId = authUser._id.toString();
      if (!session.participants.includes(myId)) {
        await Session.findOneAndUpdate(
          { sessionCode: code },
          { $addToSet: { participants: myId } },
          { new: true }
        );
      }

      const host = await User.findById(session.host).select("-password").lean();

      if (myId === host._id.toString()) {
        socket.emit("host-joined");
        console.log(`🎯 Host ${authUser.name} identified`);
      }

      const socketsInRoom = await io.in(code).fetchSockets();
      console.log(`👥 Sockets in room ${code}: ${socketsInRoom.length}`);

      // Notify all other users in the room about the new user
      socket.broadcast.to(code).emit("user-connected", {
        remoteUser: authUser.name,
        remoteSocketId: socket.id,
      });

      // If there are other users, send their info to the new user
      if (socketsInRoom.length >= 2) {
        // Get updated session to fetch all participants
        const updatedSession = await Session.findOne({ sessionCode: code }).lean();
        const otherId = updatedSession.participants.find((id) => id !== myId);
        
        if (otherId) {
          const otherUser = await User.findById(otherId).select("-password").lean();
          const otherSocket = socketsInRoom.find((s) => s.id !== socket.id);

          socket.emit("user-connected", {
            remoteUser: otherUser?.username,
            remoteSocketId: otherSocket?.id,
          });
          console.log(`🔗 Connected ${authUser.name} with ${otherUser?.username}`);
        }
      }
    } catch (err) {
      console.error("Error in joinSession:", err);
      socket.emit("error", { message: "Failed to join session." });
    }
  });

  /**
   * Session End Logic
   */
  socket.on("session-ended", async ({ code }) => {
    try {
      socket.to(code).emit("session-ended");
      
      // Clean up session in database
      await Session.findOneAndUpdate(
        { sessionCode: code },
        { status: "ended", endedAt: new Date() }
      );
    } catch (err) {
      console.error("Error ending session:", err);
    }
  });

  /**
   * User Left Logic
   */
  socket.on("user-left", async ({ code, user }) => {
    try {
      console.log(`👋 User ${user.name} left session: ${code}`);
      
      // Remove user from participants
      await Session.findOneAndUpdate(
        { sessionCode: code },
        { $pull: { participants: user._id } }
      );
      
      socket.to(code).emit("user-left", { user });
      socket.leave(code);
    } catch (err) {
      console.error("Error in user-left:", err);
    }
  });

  /**
   * Disconnect Logic
   */
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
};
