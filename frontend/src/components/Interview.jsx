import Editor from './CodeEditor.jsx'
import React from 'react'
import { useEffect } from 'react';
import { useSocket } from '../context/Socket.jsx';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';

const Interview = () => {

  const { socket } = useSocket();
  const { sessionCode } = useParams();
  const {authUser} = useAuthContext();


  //  useEffect(() => {
  //   if (socket && sessionCode) {
  //     socket.emit('join-session', {sessionCode , authUser});
  //   }
  // }, [socket, sessionCode]);

  return (
    <div>
     <Editor/>
    </div>
  )
}

export default Interview
