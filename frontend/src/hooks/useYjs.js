import { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useSocket } from '../context/Socket';
import { useAuthContext } from '../context/AuthContext';

/**
 * Custom hook for Yjs collaborative editing
 * @param {Object} editor - Monaco editor instance
 * @param {string} sessionId - Session identifier
 * @param {Function} onError - Error callback
 * @returns {Object} - Yjs utilities
 */
export const useYjs = (editor, sessionId, onError) => {
  const { socket } = useSocket();
  const { authUser } = useAuthContext();
  const ydocRef = useRef(null);
  const yTextRef = useRef(null);
  const monacoBindingRef = useRef(null);
  const updateHandlerRef = useRef(null);

  // Initialize Yjs document
  useEffect(() => {
    if (!editor || !socket || !sessionId || !authUser) return;

    // Create Y.Doc and Y.Text
    const ydoc = new Y.Doc();
    const yText = ydoc.getText('monaco');
    ydocRef.current = ydoc;
    yTextRef.current = yText;

    // Bind Monaco editor to Y.Text
    const model = editor.getModel();
    const monacoBinding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      null
    );
    monacoBindingRef.current = monacoBinding;

    // Join session and request initial document
    socket.emit('join-session', { sessionId, authUser });

    // Listen for Yjs updates from server
    const handleYjsUpdate = (updateArray) => {
      try {
        const update = new Uint8Array(updateArray);
        Y.applyUpdate(ydoc, update);
      } catch (err) {
        console.error('Error applying Yjs update:', err);
        if (onError) onError(err);
      }
    };

    socket.on('yjs-update', handleYjsUpdate);

    // Send local updates to server
    const sendUpdate = (update) => {
      socket.emit('yjs-update', Array.from(update));
    };

    ydoc.on('update', sendUpdate);
    updateHandlerRef.current = sendUpdate;

    // Cleanup on unmount
    return () => {
      if (monacoBindingRef.current) {
        monacoBindingRef.current.destroy();
      }
      if (ydocRef.current && updateHandlerRef.current) {
        ydocRef.current.off('update', updateHandlerRef.current);
      }
      socket.off('yjs-update', handleYjsUpdate);
    };
  }, [editor, socket, sessionId, authUser, onError]);

  // Save document manually
  const saveDocument = useCallback(() => {
    if (socket && sessionId) {
      socket.emit('save-document');
    }
  }, [socket, sessionId]);

  return {
    ydoc: ydocRef.current,
    yText: yTextRef.current,
    saveDocument,
  };
};
