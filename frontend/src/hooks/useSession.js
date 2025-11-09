import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/Socket';
import { useAuthContext } from '../context/AuthContext';

/**
 * Custom hook for session management
 * @param {string} sessionCode - Session code
 * @param {boolean} isHost - Whether current user is host
 * @returns {Object} - Session utilities and state
 */
export const useSession = (sessionCode, isHost = false) => {
  const { socket } = useSocket();
  const { authUser } = useAuthContext();
  const [remoteUser, setRemoteUser] = useState(null);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Join session
  useEffect(() => {
    if (!socket || !sessionCode || !authUser) return;

    socket.emit('joinSession', {
      code: sessionCode,
      authUser,
      isHost,
      socketId: socket.id,
    });
  }, [socket, sessionCode, authUser, isHost]);

  // Listen for user connections
  useEffect(() => {
    if (!socket) return;

    const handleUserConnected = ({ remoteUser: user, remoteSocketId: socketId }) => {
      setRemoteUser(user);
      setRemoteSocketId(socketId);
    };

    const handleUserLeft = ({ user }) => {
      setRemoteUser(null);
      setRemoteSocketId(null);
    };

    const handleSessionEnded = () => {
      setSessionEnded(true);
      setRemoteUser(null);
      setRemoteSocketId(null);
    };

    socket.on('user-connected', handleUserConnected);
    socket.on('user-left', handleUserLeft);
    socket.on('session-ended', handleSessionEnded);

    return () => {
      socket.off('user-connected', handleUserConnected);
      socket.off('user-left', handleUserLeft);
      socket.off('session-ended', handleSessionEnded);
    };
  }, [socket]);

  // End session (host only)
  const endSession = useCallback(() => {
    if (socket && sessionCode) {
      socket.emit('session-ended', { code: sessionCode });
      setSessionEnded(true);
    }
  }, [socket, sessionCode]);

  // Leave session
  const leaveSession = useCallback(() => {
    if (socket && sessionCode && authUser) {
      socket.emit('user-left', { code: sessionCode, user: authUser });
    }
  }, [socket, sessionCode, authUser]);

  return {
    remoteUser,
    remoteSocketId,
    sessionEnded,
    endSession,
    leaveSession,
    setRemoteUser,
    setRemoteSocketId,
  };
};
