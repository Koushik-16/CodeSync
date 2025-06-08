import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/Socket.jsx';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import Meet from './Meet.jsx';
import Editor from './CodeEditor.jsx';

const Interview = () => {
  const { socket } = useSocket();
  const { sessionCode } = useParams();
  const { authUser } = useAuthContext();
  const [remoteUser, setRemoteUser] = useState(null);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [leftWidth, setLeftWidth] = useState(null);

  const leftRef = useRef(null);
  const dividerRef = useRef(null);
  const containerRef = useRef(null);

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

  useEffect(() => {
    const container = containerRef.current;
    const left = leftRef.current;
    const divider = dividerRef.current;

    let isDragging = false;

    const startDrag = () => {
      isDragging = true;
      document.body.style.cursor = 'col-resize';
    };

    const stopDrag = () => {
      isDragging = false;
      document.body.style.cursor = 'default';
    };

    const handleDrag = (e) => {
      if (!isDragging) return;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = e.clientX - containerRect.left;
      const minWidth = 200;
      const maxWidth = containerRect.width - minWidth;
      if (newLeftWidth > minWidth && newLeftWidth < maxWidth) {
        left.style.width = `${newLeftWidth}px`;
        setLeftWidth(newLeftWidth);
      }
    };

    divider.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', stopDrag);

    return () => {
      divider.removeEventListener('mousedown', startDrag);
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex  bg-gray-900 text-white overflow-hidden"
    >
      <div ref={leftRef} className="w-1/2 min-w-[200px] overflow-auto">
        <Meet leftWidth = {leftWidth} remoteSocketId={remoteSocketId} RemoteUser={remoteUser}  setRemoteSocketId = {setRemoteSocketId}  setRemoteUser = {setRemoteUser} />
      </div>

      {/* Divider */}
      <div
        ref={dividerRef}
        className="w-1 bg-gray-700 hover:bg-gray-500 cursor-col-resize"
      ></div>

      <div className="flex-1 min-w-[200px] overflow-auto">
        <Editor remoteUser={remoteUser} />
      </div>
    </div>
  );
};

export default Interview;
