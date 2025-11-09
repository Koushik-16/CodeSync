import { useEffect, useCallback, useRef, useState } from 'react';
import peer from '../service/peer';

/**
 * Custom hook for WebRTC peer connections
 * @param {Object} socket - Socket.io instance
 * @param {string} remoteSocketId - Remote peer socket ID
 * @returns {Object} - WebRTC utilities and state
 */
export const useWebRTC = (socket, remoteSocketId) => {
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [remoteOffer, setRemoteOffer] = useState(null);
  const [streamsSent, setStreamsSent] = useState(false);
  const [called, setCalled] = useState(false);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Send local streams to peer
  const sendStreams = useCallback(() => {
    if (!myStream || !remoteSocketId) return;
    
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
    setStreamsSent(true);
  }, [myStream, remoteSocketId]);

  // Handle incoming call
  const handleAcceptCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);

      const ans = await peer.getAnswer(remoteOffer);
      socket.emit('call-accepted', { ans, to: remoteSocketId });
      setIncomingCall(false);
      
      // Send streams after accepting
      setTimeout(() => {
        for (const track of stream.getTracks()) {
          peer.peer.addTrack(track, stream);
        }
        setStreamsSent(true);
      }, 100);
    } catch (err) {
      console.error('Error accepting call:', err);
    }
  }, [socket, remoteSocketId, remoteOffer]);

  // Initiate call to remote peer
  const handleCallUser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);

      const offer = await peer.getOffer();
      socket.emit('user-call', { offer, to: remoteSocketId });
      setCalled(true);
    } catch (err) {
      console.error('Error calling user:', err);
    }
  }, [socket, remoteSocketId]);

  // Handle call accepted by remote peer
  const handleCallAccepted = useCallback(
    async ({ from, ans }) => {
      await peer.setLocalDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  // Handle negotiation needed
  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer-nego-needed', { offer, to: remoteSocketId });
  }, [socket, remoteSocketId]);

  // Handle incoming negotiation
  const handleNegoIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit('peer-nego-final', { offer: ans, to: from });
    },
    [socket]
  );

  // Handle negotiation final
  const handleNegoFinal = useCallback(async ({ from, offer }) => {
    await peer.setLocalDescription(offer);
  }, []);

  // Listen for WebRTC events
  useEffect(() => {
    if (!socket) return;

    socket.on('incomming-call', ({ from, offer }) => {
      setIncomingCall(true);
      setRemoteOffer(offer);
    });

    socket.on('call-accepted', handleCallAccepted);
    socket.on('peer-nego-needed', handleNegoIncoming);
    socket.on('peer-nego-final', handleNegoFinal);

    return () => {
      socket.off('incomming-call');
      socket.off('call-accepted');
      socket.off('peer-nego-needed');
      socket.off('peer-nego-final');
    };
  }, [socket, handleCallAccepted, handleNegoIncoming, handleNegoFinal]);

  // Handle peer negotiation needed
  useEffect(() => {
    peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  // Handle incoming tracks
  useEffect(() => {
    const handleTrack = (event) => {
      const stream = event.streams[0];
      setRemoteStream(stream);
    };

    peer.peer.addEventListener('track', handleTrack);
    return () => peer.peer.removeEventListener('track', handleTrack);
  }, []);

  // Update video elements when streams change
  useEffect(() => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
    }
  }, [myStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Cleanup streams
  const cleanup = useCallback(() => {
    myStream?.getTracks().forEach((track) => track.stop());
    peer.resetPeer();
    setMyStream(null);
    setRemoteStream(null);
    setStreamsSent(false);
    setCalled(false);
    setIncomingCall(false);
    setRemoteOffer(null);
  }, [myStream]);

  return {
    myStream,
    remoteStream,
    incomingCall,
    streamsSent,
    called,
    myVideoRef,
    remoteVideoRef,
    handleCallUser,
    handleAcceptCall,
    sendStreams,
    cleanup,
  };
};
