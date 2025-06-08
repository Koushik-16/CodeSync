import Editor from './CodeEditor.jsx'
import React from 'react'
import { useEffect , useState } from 'react';
import { useSocket } from '../context/Socket.jsx';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';

const Interview = () => {
  const { socket } = useSocket();
  const { sessionCode } = useParams();
  const {authUser} = useAuthContext();
  // console.log("Auth User in Interview", authUser);
    
    // State to manage remote user and socket ID

  const [remoteUser , setRemoteUser] = useState(null);
    const [remoteSocketId , setRemoteSocketId] = useState(null);

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
     <Editor remoteUser = {remoteUser}  />
     
    </div>
  )
}

export default Interview
