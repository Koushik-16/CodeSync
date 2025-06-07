import Editor from './CodeEditor.jsx'
import React from 'react'
import { useEffect , useState } from 'react';
import { useSocket } from '../context/Socket.jsx';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import Footer from './Footer.jsx';

const Interview = () => {
  const [remoteUser , setRemoteUser] = useState(null);
  const [remoteSocketId , setRemoteSocketId] = useState(null);
  const { socket } = useSocket();
  const { sessionCode } = useParams();
  const {authUser} = useAuthContext();


  useEffect(() => {
    if (!socket) return;
    socket.on('user-connected', ({ remoteUser, remoteSocketId }) => {
      setRemoteUser(remoteUser);
      setRemoteSocketId(remoteSocketId);
    });

    return () => {
      socket.off('user-connected');
    };
  }, [socket]);
 
  return (
    <div>
     <Editor remoteUser = {remoteUser} />
     
    </div>
  )
}

export default Interview
