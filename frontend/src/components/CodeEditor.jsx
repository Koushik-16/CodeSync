import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MenuItem, Select, Slider } from '@mui/material';
import { useSocket } from '../context/Socket.jsx';
import { useAuthContext } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import axios from 'axios';


const languageOptions = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
];

const NAVBAR_HEIGHT = 80;

const CodeEditor = ({remoteUser}) => {
  const editorRef = useRef(null);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [outputHeight, setOutputHeight] = useState(200);
  const [dragging, setDragging] = useState(false);
  const [editorReady, setEditorReady] = useState(false); // NEW
  const [codeError , setCodeError] = useState('');
  const [iscodeRunning , setIsCodeRunning] = useState(false);
  
  const { socket } = useSocket();
  const { authUser } = useAuthContext();
  const { code } = useParams(); // session id
  const [copied, setCopied] = useState(false);
  const ydocRef = useRef(null);
  const yTextRef = useRef(null);
  const monacoBindingRef = useRef(null);
  const sessionId = code || 'null'; // Fallback session ID

  // Run code stub
  const runCode = async () => {
    if(!editorRef.current) return;
    const code = editorRef.current.getValue();
    const version = "*";
    setCodeError(''); // Clear previous errors
    setOutput("");
    setIsCodeRunning(true);
    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language,
      version,
      files: [
        {
          name: "main",
          content: code,
        },
      ],
      
    });

     const { run } = response.data;
    setIsCodeRunning(false);

    if (run.stderr) {
      setCodeError(true); // assuming you have a state to show output
      setOutput(run.stderr);
      sendOutputToServer(sessionId, run.stderr , true);
    } else {
      setOutput(run.stdout);
      sendOutputToServer(sessionId, run.stdout , false);
    }


    } catch (error) {
       console.error("Error running code:", error);
    setOutput("Failed to execute code.");
    }

  };

  const sendOutputToServer = (sessionId, output , hasError) => {
    if (!socket || !sessionId || !authUser) return;

    const outputData = {
      sessionId: sessionId,
      output,
      hasError 
    };

    socket.emit('code-output', outputData);
  }

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
  
 //handle copy to clipboard
  const handleCopy = () => {
  navigator.clipboard.writeText(sessionId);
  setCopied(true);
  setTimeout(() => setCopied(false), 1500);
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
  socket.emit('change-language', {  sessionId, language: newLang });
  // Emit code clear event
  socket.emit('clear-code', {  sessionId });
  setOutput("");
  sendOutputToServer(sessionId , "" , false)
};


useEffect(() => {
  if (!socket || !sessionId) return;

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
}, [socket, sessionId]);



  // Yjs + Monaco + Socket.io collaborative logic
  useEffect(() => {
    if (!socket || !editorReady || !authUser || !sessionId) return;

    const editor = editorRef.current;
    if (!editor) return;

    // 1. Setup Yjs Doc and Text
    const ydoc = new Y.Doc();
    const yText = ydoc.getText('monaco');
    ydocRef.current = ydoc;
    yTextRef.current = yText;

    // 2. Join session and request document state
    socket.emit('join-session', { sessionId , authUser  });
    socket.on('language-changed', ({ language }) => {
  setLanguage(language);
});

socket.emit('get-language', { sessionId }, (languageFromServer) => {
  if (languageFromServer) setLanguage(languageFromServer);
});


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
      socket.off('language-changed');
      clearInterval(saveInterval);
      if (monacoBindingRef.current) {
        monacoBindingRef.current.destroy();
        monacoBindingRef.current = null;
      }
    };
  }, [socket, editorReady, authUser, sessionId]);


  useEffect(() => {
    if (!socket || !sessionId) return; 

    const updateOutput = ({output , hasError}) => {
       setOutput(output);
       setCodeError(hasError);
    }
    socket.on('code-output', updateOutput);

    return () => {
      socket.off('code-output', updateOutput);
    };
  } , [socket, sessionId]);

  // Layout
  const totalHeight = `calc(85vh - ${NAVBAR_HEIGHT}px)`;
  const editorHeight = `calc(100vh - ${NAVBAR_HEIGHT}px - ${outputHeight}px)`;

  return (
    <div className="bg-[#0f111a] text-white px-4 pt-20 overflow-hidden">
     <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono bg-gray-800 px-3 py-1 rounded text-blue-300">
          Session ID: {sessionId}
        </span>
         
        <button
          onClick={handleCopy}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition"
        >
          {copied ? "Copied!" : "Copy"}
          
        </button>
        
      </div>
    </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="text-2xl font-bold text-blue-400">CodeSync</div>
        {remoteUser  && 
          <span className="text-sm font-mono bg-gray-800 px-3 py-1 rounded text-green-400">you are connected to {remoteUser}</span>
          } 
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
            disabled = {iscodeRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md "
          >
           {iscodeRunning ? "Running..." : "Run Code"}
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
            defaultValue="// Loading..."
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
          <h2 className="text-lg font-semibold mb-2 text-white ${}">Output</h2>
          <pre className= {codeError ? "text-red-600" : "text-green-600"}>{output}</pre>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;