import React , { useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext';
import { useAuthContext } from '../context/AuthContext';
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import randomColor from 'randomcolor'
import { useParams } from 'react-router-dom';

const TextEditor = () => {

   const { socket } = useSocket();
   const { authUser } = useAuthContext();
   const { code } = useParams(); // session id

 const ydocRef = useRef(null);
  const yTextRef = useRef(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
   const sessionId = code; // Use the session ID from the URL params
  const user = {
    name: authUser?.username || 'Anonymous',
    color: randomColor({ luminosity: 'dark' }),
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydocRef.current,
      }),
      CollaborationCursor.configure({
        user,
        provider: {
          awareness: {
            setLocalState: () => {},
            on: () => {},
          },
        },
      }),
    ],
  });

  useEffect(() => {
    if(!socket || !authUser || !sessionId) return ;
    const ydoc = new Y.Doc();
    const yText = ydoc.getText('prosemirror');
    ydocRef.current = ydoc;
    yTextRef.current = yText;
    

  })

  useEffect(() => {
    if (editor) setEditorLoaded(true);
  }, [editor]);


  return (
     <div className="p-4 max-w-4xl mx-auto mt-6 border rounded shadow bg-white">
      <h2 className="text-xl font-bold mb-3">Collaborative Text Editor</h2>
      {editorLoaded ? (
        <EditorContent editor={editor} className="prose max-w-none border rounded p-4 bg-white" />
      ) : (
        <p>Loading editor...</p>
      )}
    </div>
  )
}

export default TextEditor
