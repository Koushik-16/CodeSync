/**
 * Handle WebRTC signaling events
 */
export const handleWebRTCEvents = (socket, io) => {
  /**
   * User calls another user
   */
  socket.on("user-call", ({ offer, to }) => {
    io.to(to).emit("incomming-call", { from: socket.id, offer });
  });

  /**
   * Call accepted
   */
  socket.on("call-accepted", ({ ans, to }) => {
    io.to(to).emit("call-accepted", { from: socket.id, ans });
  });

  /**
   * Peer negotiation needed
   */
  socket.on("peer-nego-needed", ({ offer, to }) => {
    io.to(to).emit("peer-nego-needed", { from: socket.id, offer });
  });

  /**
   * Peer negotiation final
   */
  socket.on("peer-nego-final", ({ offer, to }) => {
    io.to(to).emit("peer-nego-final", { from: socket.id, offer });
  });
};
