# CodeSync — Complete Project Documentation

Last updated: 2025-11-28

## Overview

CodeSync is a modern, collaborative, real-time code editor with built-in WebRTC video/audio, powered by Yjs (CRDT) for deterministic conflict-free document synchronization and Socket.IO for low-latency event relay. The platform supports multi-language editing (JavaScript, Python, Java, C++), remote code execution via the Piston API, JWT authentication, and MongoDB persistence for session and code states.

This document describes the project's goals, architecture, implementation details, technology choices, developer workflow, setup instructions, testing guidance, pros and cons, and suggested next steps.

---

## Goals

- Real-time collaborative editing with low-latency synchronization and conflict-free merges.
- Video/audio calls integrated per session for interview-like experience.
- Persistent storage of session documents and language-specific snippets.
- Secure authentication and scalable architecture to support multi-user sessions.
- Clean, modular codebase to enable maintainability and future feature work.

---

## Quick Project Facts

- Frontend: React + Monaco Editor + Yjs + y-monaco
- Backend: Node.js + Express + Socket.IO + Yjs integration
- Database: MongoDB (Mongoose models for Session, CodeSnippet, User)
- WebRTC: Peer-to-peer using RTCPeerConnection with a custom peer helper
- Code execution: Piston API (emkc.org) for multi-language execution
- Key files/folders:
  - `frontend/src/components/` — UI components (CodeEditor, Meet, Interview, etc.)
  - `frontend/src/hooks/` — custom hooks (`useYjs`, `useWebRTC`, `useSession`)
  - `backend/socket/handlers/` — socket modules (`yjsHandler.js`, `codeHandler.js`, `webrtcHandler.js`, `sessionHandler.js`)
  - `backend/models/` — Mongoose models (`session.model.js`, `code.model.js`, `user.model.js`)

---

## Pros and Cons

### Pros

- Real-time collaboration via Yjs CRDT ensures conflict-free merging and offline edits that sync on reconnection.
- Modular socket handlers (session, yjs, webrtc, code) improve maintainability and testability.
- Multi-language persistence: separate Yjs states and DB storage for each language, preventing accidental data loss on language switches.
- Debounced persistence reduces DB write load while ensuring eventual durability.
- Native WebRTC (HTML5 video elements) reduces third-party dependency issues and supports direct MediaStream handling.
- Security middleware (Helmet, rate-limiter) and JWT-based authentication are included.
- Clear separation between frontend and backend responsibilities enables independent scaling.

### Cons / Limitations

- In-memory Y.Doc caching: while it's fast, it consumes RAM per session and per language — may need Redis or persistent cache for horizontal scaling.
- No integrated STUN/TURN server management in repo — necessary for reliable NAT traversal at scale; the app relies on browser defaults or environment configuration.
- Piston API is a third-party dependency for code execution — using hosted service introduces rate limits, network dependencies, and potential security concerns for untrusted code.
- No built-in rate-limited sandboxing for executed code — using Piston mitigates but additional checks are recommended for production.
- Frontend logging was present during development (now removed) — ensure structured logging for server-side troubleshooting.
- No CI/CD or infrastructure files for automatic deployment included (beyond `ecosystem.config.js` for PM2).

---

## Tech Stack & Decisions (Rationale)

### Frontend

- React: chosen for its component model, ecosystem (Monaco integration), and speed of development.
- Monaco Editor (`@monaco-editor/react`) provides a VS Code-like editing experience with excellent performance for large files.
- Yjs + `y-monaco`: CRDT-based collaboration chosen for conflict-free merging and offline editing semantics.
- Socket.IO Client: lightweight realtime transport for events (kept separate from Yjs update transport; used to relay Yjs updates and signaling for WebRTC).
- MUI for UI primitives (select, slider) for quick UX components.

Why not WebSockets only or Operational Transforms (OT)?
- CRDTs (Yjs) were chosen because they avoid central conflict resolution and merge reliably with lower complexity for concurrent edits.

### Backend

- Node.js + Express: natural pairing with Socket.IO and JavaScript-based frontend. Easy to maintain a single language stack.
- Socket.IO: simplifies event routing and room management for sessions. Chosen over raw WebSocket to handle reconnection and presence easily.
- MongoDB with Mongoose: flexible document model for session, user, and code data. Indexes added to optimize frequent session queries.
- Yjs server-side logic: holds in-memory Y.Doc per session (and per language) for efficient collaborative state handling and periodic persistence.

Alternatives considered:
- PostgreSQL: stronger relational integrity but less natural for nested document Yjs state storage; MongoDB fits Yjs base64 blobs well.
- Redis: recommended as a next step for caching and session pub/sub to scale Socket.IO horizontally using Redis adapter.

### WebRTC

- Implementation uses native RTCPeerConnection for fine-grained control, avoiding ReactPlayer which doesn't handle MediaStream objects reliably.
- Signaling is done via Socket.IO handlers in `webrtcHandler.js`.

---

## Architecture Overview

1. Client connects to server (Express + Socket.IO).
2. On session join, client requests language-specific Yjs state; server loads DB snapshot (if exists) and applies updates to a server-side Y.Doc for that session-language.
3. Yjs updates are exchanged via Socket.IO events (`yjs-update`) tagged with `language` so multiple language contexts can be supported concurrently.
4. The server debounces saves per session-language (2s default) and stores Yjs binary updates as base64 in `CodeSnippet` documents (field: `codeByLanguage.<lang>.update`).
5. WebRTC signaling uses the `webrtcHandler.js` for call offer/answer relays and negotiation messages.
6. Code execution is executed via Piston on-demand, with output broadcast to session clients.

Diagram (high level):

- Browser (Monaco + Yjs) <--Socket.IO--> Server (Socket handlers) <---> MongoDB
- Browser (WebRTC) <--- peer-to-peer ---> Browser (WebRTC) with Socket.IO signaling

---

## Data Models (High-level)

### `Session` (backend/models/session.model.js)
- sessionCode (string, unique)
- host (user id)
- participants (array)
- status, timestamps
- indexes on `sessionCode`, `host`

### `CodeSnippet` (backend/models/code.model.js)
- sessionId (ObjectId)
- codeByLanguage: object with keys `javascript`, `python`, `java`, `cpp`, each containing `{ update: <base64 string> }`
- currentLanguage (string)
- lastUpdated timestamp
- compound index on `{ sessionId, lastUpdated }`

### `User` (backend/models/user.model.js)
- username/email/password (hashed)
- standard authentication fields

---

## Socket Handlers & Events

All Socket.IO handling is modularized in `backend/socket/handlers/`.

### `sessionHandler.js`
- Handles: `joinSession`, participant management, broadcasts about user-joined/user-left, session lifecycle.
- Ensures participants array updated and emits events like `user-connected`.

### `yjsHandler.js`
- Responsible for: maintaining in-memory Y.Doc per session-language, applying incoming `yjs-update` events, broadcasting updates to room members, and debounced persistence to DB.
- Key behaviors:
  - `join-session` accepts `language` and returns the initial Yjs update for that language.
  - `yjs-update` payload includes `{ update, language }` so server applies updates to the correct Y.Doc.
  - `debouncedSave(sessionCode, language, ydoc)` encodes the state via `Y.encodeStateAsUpdate` and stores base64 into `CodeSnippet`.

### `codeHandler.js`
- Language switching: events `change-language`, `get-language`, `get-code-for-language`, `clear-code`.
- Persists `currentLanguage` in DB and broadcasts `language-changed` events.
- Provides `get-code-for-language` callback to pull DB snapshot.

### `webrtcHandler.js`
- Signaling endpoints: `user-call`, `call-accepted`, `peer-nego-needed`, `peer-nego-final`.
- Relays offers/answers/ICE/negotiation messages between peers via `socket.to(socketId).emit()`.

---

## Frontend Implementation Summary

Major components in `frontend/src/components/`:

### `CodeEditor.jsx`
- Monaco Editor with Yjs binding via `y-monaco`.
- Maintains separate in-memory Yjs docs per language: `ydocRefs` and `yTextRefs`.
- On language switch: saves current language automatically (via Yjs events) and joins/loads requested language Y.Doc from server.
- Emits/receives `yjs-update` with language tag to ensure correct doc updates.
- Periodic save via emits `save-document` (2s default) — server also uses debounced saving.
- Code execution: calls Piston API and broadcasts output via `code-output` socket event.

### `Meet.jsx`
- Native `<video>` elements to play local/remote streams (`srcObject` assigned programmatically)
- Uses `useWebRTC` hook and socket signaling events for peer negotiation.

### `Interview.jsx` and `Home.jsx`
- Layout components orchestrating editor, video, and controls, including session creation/joining.

### Hooks
- `useYjs.js`: helper wrap for Yjs setup (centralizes logic, error handling, and socket integration)
- `useWebRTC.js`: encapsulates peer connection logic and media handling
- `useSession.js`: session lifecycle and API interactions

---

## Key Implementation Details and Important Code Paths

### Yjs updates
- Clients bind Monaco to a Yjs `Y.Text` via `y-monaco`'s `MonacoBinding`.
- Local updates produce binary Yjs updates via `Y.encodeStateAsUpdate` and `ydoc.on('update', ...)` sends them to server with Socket.IO.
- Server applies updates to its in-memory `Y.Doc` for that session-language and rebroadcasts to other clients in the room.
- Server-side persistence encodes the full state and stores it as base64 in the `CodeSnippet` model.

### Multi-language persistence
- Each language has its own server Y.Doc entry and a distinct DB field `codeByLanguage.<lang>.update`.
- On language switch, the frontend requests the `join-session` with `language` param to receive the full language-specific update.
- This prevents overwriting or losing code when switching languages.

### Debounced saves
- Server keeps a `savePendingDocs` map keyed by `sessionCode:language`.
- After an update, server resets a 2s timer; when it fires, it writes the encoded state to DB. This balances durability and DB write costs.

### WebRTC signaling
- Offer/answer and negotiation messages flow through `webrtcHandler.js` using `socket.to(socketId).emit(...)` so that peers communicate securely via the signaling channel.
- Media streams are attached to video elements via `element.srcObject = stream;` instead of using ReactPlayer (which doesn't accept MediaStream directly).

---

## Developer Workflow & Setup

### Prerequisites
- Node.js 18+ recommended
- MongoDB (local or remote)
- Optional: PM2 for process management (repo contains `ecosystem.config.js`)

### Environment
- Copy `backend/.env.example` to `backend/.env` and fill values (PORT, FRONTEND_URL, MONGODB_URI, JWT_SECRET, etc.)

### Install & Run (dev)

Open two terminals.

Backend:
```powershell
cd backend
npm install
npm run dev
```

Frontend:
```powershell
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` (Vite default) to open the frontend; backend typically runs on `http://localhost:5000`.

### Build & Production

Build frontend and serve static assets from backend or static host.

```powershell
cd frontend
npm run build
# Then deploy build output from /frontend/dist with your static host or serve with backend.
```

Use PM2 to run backend

```powershell
cd backend
pm install
pm run start # or pm2 start ecosystem.config.js
```

---

## Testing & Troubleshooting

### Manual tests
- Join session with two browsers to test collaboration.
- Write code in JS, switch to Python and back — ensure both language states persist.
- Start a WebRTC call and confirm video/audio appears in both peers.
- Run code execution and verify output is broadcast to participants.

### Logs
- Backend logs should show Yjs saves, session joins, and WebRTC signaling events. Use `pm2 logs` if deployed with PM2.

### Common Issues & Fixes
- Blank editor on join: ensure `join-session` includes language param, and server returns `yjs-update` initial state (full update) for that language.
- Video not showing: check that local stream obtained (`navigator.mediaDevices.getUserMedia`) and that `<video>` element receives `srcObject`.
- Code not persisting: ensure server can write to MongoDB and `savePendingDocs` timers fire (wait ~2s after pause in typing).
- NAT connectivity issues: configure STUN/TURN servers for reliable WebRTC calls.

---

## Security Considerations

- JWT tokens used for authentication; cookies/localStorage handlers are present on frontend.
- Helmet/compression/rate limiting are enabled on backend.
- Execution of arbitrary code is delegated to Piston — be mindful of executing untrusted code and consider stronger sandboxing for production.
- For production, use HTTPS and secure cookies, and set proper CORS rules.

---

## Performance & Scalability

- Current setup uses in-memory Yjs docs per session-language; this is fast but requires vertical scaling and state replication for horizontal scaling.
- To scale horizontally:
  - Use the Socket.IO Redis adapter to share rooms and pub/sub across instances.
  - Persist Yjs docs in Redis (or use a Yjs provider) for fast cross-instance access.
  - Offload heavy code execution to dedicated workers and scale Piston usage or self-host runner.
- Optimize DB writes by tuning debounce timings and/or using delta-only persistence.

---

## Operational Recommendations

- Add a STUN/TURN server (coturn) with credentials in production env for reliable WebRTC.
- Use Redis for caching and session pub/sub.
- Add observability (Prometheus + Grafana) and structured logs for server side.
- Implement CI pipeline with automated tests and linting.
- Add rate limits and input sanitization around code execution endpoints.

---

## Future Work & Feature Ideas

- Add TypeScript, Rust, Go language support (extend `codeByLanguage`).
- Version history per session and per language (snapshots and diffs).
- AI-powered code assistant (auto-complete, explain, refactor) using an LLM via server-side integration.
- Live replay (time-travel) and commit-like snapshots for edits.
- Role-based permissions for sessions (read-only observers, interviewer, candidate).
- Persistent recording of sessions (store video + code timeline).

---

## Files of Interest (quick pointers)

- Backend
  - `backend/index.js` — express + socket setup and middleware
  - `backend/socket/socket.js` — main socket initialization
  - `backend/socket/handlers/yjsHandler.js` — yjs sync logic
  - `backend/socket/handlers/codeHandler.js` — language and code operations
  - `backend/socket/handlers/webrtcHandler.js` — signaling functions
  - `backend/models/code.model.js` — code snippet persistence schema

- Frontend
  - `frontend/src/components/CodeEditor.jsx` — editor + yjs binding
  - `frontend/src/components/Meet.jsx` — video call UI
  - `frontend/src/hooks/useYjs.js` — reusable yjs logic
  - `frontend/src/hooks/useWebRTC.js` — reusable peer logic

---

## Contribution & Code Style

- JavaScript/React style with ES6 modules and async/await.
- Keep socket event names in kebab-case (e.g., `join-session`, `yjs-update`).
- Keep server-side logic modular: handlers per concern.
- Prefer `lean()` for read-only Mongoose queries to reduce memory.

---

## Copyright & Licensing

- No license included in repo — add `LICENSE` if you'd like to publish or restrict terms.

---

## Contact & Maintainers

- Repository owner: `Koushik-16` (local workspace owner: Koushik)
- For any questions or changes, open an issue or PR in the repository.

---

## Appendix: Quick Commands

Backend dev:

```powershell
cd backend
npm install
npm run dev
```

Frontend dev:

```powershell
cd frontend
npm install
npm run dev
```

Build frontend:

```powershell
cd frontend
npm run build
```

Start backend (production, pm2 example):

```powershell
cd backend
pm2 start ecosystem.config.js
pm2 logs
```


---

End of documentation.
