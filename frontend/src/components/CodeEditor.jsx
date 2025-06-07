import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MenuItem, Select, Slider } from '@mui/material';
import { useSocket } from '../context/Socket.jsx';
import { useAuthContext } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';

const languageOptions = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
];

const NAVBAR_HEIGHT = 80;

const CodeEditor = () => {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [outputHeight, setOutputHeight] = useState(200);
  const [dragging, setDragging] = useState(false);
  const [editorReady, setEditorReady] = useState(false); // NEW
  const { socket } = useSocket();
  const { authUser } = useAuthContext();
  const { code } = useParams(); // session id
  const ydocRef = useRef(null);
  const yTextRef = useRef(null);
  const monacoBindingRef = useRef(null);

  // Run code stub
  const runCode = () => {};

  // Dragging for output resize
  const startDragging = () => {
    setDragging(true);
    document.body.style.cursor = 'row-resize';
  };
  const stopDragging = () => {
    setDragging(false);
    document.body.style.cursor = 'default';
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    const totalHeight = window.innerHeight - NAVBAR_HEIGHT;
    const newOutputHeight = window.innerHeight - e.clientY;
    const minHeight = 100;
    const maxHeight = totalHeight - 100;
    if (newOutputHeight >= minHeight && newOutputHeight <= maxHeight) {
      setOutputHeight(newOutputHeight);
    }
  };

  // Editor mount handler
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setEditorReady(true);
  };

  // Output resize listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDragging);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [dragging]);

 const handleLanguageChange = (e) => {
  const newLang = e.target.value;
  setLanguage(newLang);
  socket.emit('change-language', { sessionId: code, language: newLang });
  // Emit code clear event
  socket.emit('clear-code', { sessionId: code });
};


useEffect(() => {
  if (!socket || !code) return;

  const handleLanguage = ({ language }) => {
    setLanguage(language);
  };

  const handleClearCode = () => {
    // Clear Yjs doc for all users
    if (ydocRef.current && yTextRef.current) {
      yTextRef.current.delete(0, yTextRef.current.length);
    }
  };

  socket.on('language-changed', handleLanguage);
  socket.on('clear-code', handleClearCode);

  return () => {
    socket.off('language-changed', handleLanguage);
    socket.off('clear-code', handleClearCode);
  };
}, [socket, code]);



  // Yjs + Monaco + Socket.io collaborative logic
  useEffect(() => {
    if (!socket || !editorReady || !authUser || !code) return;

    const editor = editorRef.current;
    if (!editor) return;

    // 1. Setup Yjs Doc and Text
    const ydoc = new Y.Doc();
    const yText = ydoc.getText('monaco');
    ydocRef.current = ydoc;
    yTextRef.current = yText;

    // 2. Join session and request document state
    socket.emit('join-session', { sessionId: code, authUser });

    // 3. Receive initial document state from server
    const handleInitialDoc = (updateArray) => {
      if (updateArray && updateArray.length > 0) {
        Y.applyUpdate(ydoc, new Uint8Array(updateArray));
      }
      // Set Monaco value from Yjs state (only once)
      const model = editor.getModel();
      if (model) model.setValue(yText.toString());

      // 4. Bind Monaco <-> Yjs
      monacoBindingRef.current = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        null
      );
    };
    socket.once('yjs-update', handleInitialDoc);

    // 5. On local Yjs update, send to server
    const onUpdate = (update) => {
      socket.emit('yjs-update', Array.from(update));
    };
    ydoc.on('update', onUpdate);

    // 6. On remote update, apply to local Yjs doc
    const handleRemoteUpdate = (updateArray) => {
      Y.applyUpdate(ydoc, new Uint8Array(updateArray));
    };
    socket.on('yjs-update', handleRemoteUpdate);

    // 7. Periodic save (optional)
    const saveInterval = setInterval(() => {
      socket.emit('save-document');
    }, 2000);

    // Cleanup
    return () => {
      ydoc.off('update', onUpdate);
      socket.off('yjs-update', handleRemoteUpdate);
      socket.off('yjs-update', handleInitialDoc);
      clearInterval(saveInterval);
      if (monacoBindingRef.current) {
        monacoBindingRef.current.destroy();
        monacoBindingRef.current = null;
      }
    };
  }, [socket, editorReady, authUser, code]);

  // Layout
  const totalHeight = `calc(90vh - ${NAVBAR_HEIGHT}px)`;
  const editorHeight = `calc(100vh - ${NAVBAR_HEIGHT}px - ${outputHeight}px)`;

  return (
    <div className="bg-[#0f111a] text-white px-4 pt-20 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="text-2xl font-bold text-blue-400">CodeSync</div>
        <div className="flex flex-wrap gap-4 items-center">
          <Select
            value={language}
            onChange={handleLanguageChange}
            variant="outlined"
            size="small"
            sx={{
              color: 'white',
              backgroundColor: '#1e1e2e',
              '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00b0ff' },
              '& .MuiSvgIcon-root': { color: 'white' },
            }}
          >
            {languageOptions.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {lang.label}
              </MenuItem>
            ))}
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Font</span>
            <Slider
              value={fontSize}
              onChange={(e, val) => setFontSize(val)}
              min={12}
              max={24}
              step={1}
              size="small"
              sx={{ width: 100, color: '#00b0ff' }}
            />
          </div>
          <button
            onClick={runCode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Run Code
          </button>
        </div>
      </div>
      {/* Editor + Output Section */}
      <div
        className="w-full overflow-hidden rounded-lg border border-gray-700"
        style={{ height: totalHeight }}
      >
        {/* Code Editor */}
        <div style={{ height: editorHeight }}>
          <Editor
            height="100%"
            language={language}
            defaultValue="// Write your code here"
            theme="vs-dark"
            onMount={handleEditorDidMount}
            options={{ fontSize }}
          />
        </div>
        {/* Resize Bar */}
        <div
          className="h-2 bg-gray-600 cursor-row-resize"
          onMouseDown={startDragging}
        />
        {/* Output */}
        <div
          className="bg-[#1e1e2e] text-green-400 p-4 overflow-auto border-t border-gray-700"
          style={{ height: `${outputHeight}px` }}
        >
          <h2 className="text-lg font-semibold mb-2 text-white">Output</h2>
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;