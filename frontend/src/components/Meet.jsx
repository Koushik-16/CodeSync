import React, { useEffect, useCallback, useState } from 'react';
import { useSocket } from '../context/Socket';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import peer from '../service/peer';
import axios from 'axios';
import { useAuthContext } from '../context/AuthContext';

const Meet = ({ RemoteUser, remoteSocketId  , setRemoteUser , setRemoteSocketId}) => {
  const { socket } = useSocket();
  const {   code } = useParams();
  const { authUser } = useAuthContext();
  const location = useLocation();
  const isHost = location.state?.isHost || false;
  const navigate = useNavigate();
  const [sessionCode , setSessionCode] = useState(code);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incommingCall, setIncommingCall] = useState(false);
  const [remoteOffer, setRemoteOffer] = useState(null);
  const [streamsSent, setStreamsSent] = useState(false);
  const [called, setCalled] = useState(false);

  const sendStreams = useCallback(() => {
    if (!myStream || !remoteSocketId) return;
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
    setStreamsSent(true);
  }, [myStream, remoteSocketId]);

  const handleAcceptCall = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    setMyStream(stream);
    const ans = await peer.getAnswer(remoteOffer);
    socket.emit('call-accepted', { ans, to: remoteSocketId });
    setIncommingCall(false);
    sendStreams();
  }, [socket, remoteSocketId, remoteOffer, sendStreams]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    setMyStream(stream);
    const offer = await peer.getOffer();
    socket.emit('user-call', { offer, to: remoteSocketId });
    setCalled(true);
  }, [socket, remoteSocketId]);

  const handleCallAccepted = useCallback(async ({ from, ans }) => {
    await peer.setLocalDescription(ans);
    sendStreams();
  }, [sendStreams]);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer-nego-needed', { offer, to: remoteSocketId });
  }, [socket, remoteSocketId]);

  const handleNegoIncomming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit('peer-nego-final', { offer: ans, to: from });
  }, [socket]);

  const handleNegoFinal = useCallback(async ({ from, offer }) => {
    await peer.setLocalDescription(offer);
  }, []);

  useEffect(() => {
    if (socket && sessionCode && authUser) {
      socket.emit('joinSession', {
        code: sessionCode,
        authUser,
        isHost,
        socketId: socket.id
      });
    }
  }, [socket, sessionCode, authUser, location]);

  useEffect(() => {
    peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    if (!socket) return;

    socket.on('incomming-call', ({ from, offer }) => {
      setIncommingCall(true);
      setRemoteOffer(offer);
    });

    socket.on('call-accepted', handleCallAccepted);
    socket.on('peer-nego-needed', handleNegoIncomming);
    socket.on('peer-nego-final', handleNegoFinal);

    return () => {
      socket.off('incomming-call');
      socket.off('call-accepted');
      socket.off('peer-nego-needed');
      socket.off('peer-nego-final');
    };
  }, [socket, handleCallAccepted, handleNegoIncomming, handleNegoFinal]);

  useEffect(() => {
    const handleTrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);
    };
    peer.peer.addEventListener('track', handleTrack);
    return () => peer.peer.removeEventListener('track', handleTrack);
  }, []);

  const handleEndSession = async () => {
    myStream?.getTracks().forEach((track) => track.stop());
    peer.resetPeer();
    socket.emit('session-ended', { code: sessionCode });
    await axios.post(`http://localhost:5000/api/interview/sessions/${sessionCode}/end`, { sessionCode }, { withCredentials: true });
    navigate('/', { replace: true });
  };


  useEffect(() => {
    if(!socket) return;
         socket.on('user-left', ({ user }) => {
        setRemoteUser(null);
        setRemoteStream(null);
        setRemoteSocketId(null);
        setStreamsSent(false);
        setRemoteOffer(null);
        setCalled(false);
        alert(`${user?.name} has left the session`);
    });
      return () => {
        socket.off('user-left');
      }
  }, []);

  const handleLeaveSession = () => {
    myStream?.getTracks().forEach((track) => track.stop());
    peer.resetPeer();
    socket.emit('user-left', { code: sessionCode, user: authUser });
    navigate('/', { replace: true });
  };

  return (
    <div className="pt-16 px-4 pb-6 min-h-screen bg-gray-900 text-white overflow-auto">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <p className="mb-4">
          {RemoteUser ? `Connected to: ${RemoteUser}` : 'Not connected to anyone'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myStream && (
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="text-lg mb-2">My Stream</h3>
              <ReactPlayer playing muted height="200px" width="100%" url={myStream} />
            </div>
          )}

          {remoteStream && (
            <div className="bg-gray-700 p-4 rounded">
              <h3 className="text-lg mb-2">Remote Stream</h3>
              <ReactPlayer playing height="200px" width="100%" url={remoteStream} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          {RemoteUser && isHost && !called && (
            <button
              onClick={handleCallUser}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Call
            </button>
          )}

          {myStream && !streamsSent && !isHost && (
            <button
              onClick={sendStreams}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
            >
              Send Stream
            </button>
          )}

          {incommingCall && (
            <button
              onClick={handleAcceptCall}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Accept Call from {RemoteUser}
            </button>
          )}

          {isHost ? (
            <button
              onClick={handleEndSession}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              End Session
            </button>
          ) : (
            <button
              onClick={handleLeaveSession}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded"
            >
              Leave Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Meet;
