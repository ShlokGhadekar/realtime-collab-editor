# 🚀 ColabEditor

### Real-Time Collaborative Code Editor

ColabEditor is a full-stack collaborative coding platform that allows multiple users to write, edit, and execute code together in real time. Inspired by collaborative tools like Google Docs, it combines live synchronization, authentication, and code execution into a single developer-friendly workspace.

---

## ✨ Features

### 🤝 Real-Time Collaboration
- Multi-user collaborative editing
- Instant synchronization using WebSockets
- Room-based coding sessions

### 🔐 Authentication & Security
- JWT-based authentication
- Secure user registration and login
- Protected collaborative workspaces

### 💻 Code Editor
- Monaco Editor (VS Code editor engine)
- Syntax highlighting for 7+ languages
- Auto-save functionality
- Debounced updates for improved performance

### ⚡ Code Execution
- Execute code directly from the browser
- Support for multiple programming languages
- Real-time output display

### 🗄 Persistence
- PostgreSQL database integration
- User and room data persistence
- Automatic document saving

---

## 🏗 Architecture

```text
┌───────────────┐
│    React UI   │
│  Next.js App  │
└───────┬───────┘
        │
        │ HTTP / JWT
        ▼
┌────────────────────┐
│ Spring Boot Backend│
└───────┬────────────┘
        │
        ├──────────────► PostgreSQL
        │
        ▼
 WebSocket + STOMP
        │
        ▼
 Multiple Clients
```

---

## 🛠 Tech Stack

### Frontend
- React
- Next.js
- TypeScript
- Monaco Editor
- Yjs (CRDT)
- Tailwind CSS

The UI follows the design tokens in [`frontend/DESIGN.md`](frontend/DESIGN.md) (Linear's design language, from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)); colors live as Tailwind theme tokens in `app/globals.css` and shared components in `components/ui.tsx`.

### Backend
- Java 17
- Spring Boot 3
- Spring Security
- WebSocket
- STOMP
- JWT Authentication

### Database
- PostgreSQL

### Deployment
- Docker
- Render
- Vercel

---

## 📸 Screenshots

### Collaborative Editor

```md
![Collaborative Editor](assets/editor.png)
```

### Dashboard

```md
![Dashboard](assets/dashboard.png)
```

### Code Execution

```md
![Code Execution](assets/execution.png)
```

---

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/ShlokGhadekar/realtime-collab-editor.git
cd realtime-collab-editor
```

### Backend Setup

```bash
cd backend

mvn clean install
mvn spring-boot:run
```

### Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

---

## ⚙ Environment Variables

### Backend

Copy `backend/.env.example` to `backend/.env` and fill it in. Spring loads this file automatically; in production, set the same values as environment variables instead.

```env
JWT_SECRET=            # required, generate with: openssl rand -hex 32
JDOODLE_CLIENT_ID=     # optional, enables code execution
JDOODLE_CLIENT_SECRET=
CORS_ALLOWED_ORIGINS=  # optional, comma-separated frontend URLs
```

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

---

## 🧠 Engineering Challenges

### WebSocket Authentication
JWT authentication does not automatically propagate to WebSocket connections. A custom STOMP interceptor validates tokens before establishing WebSocket sessions.

### Real-Time Synchronization
The first version broadcast the whole document on every keystroke and replaced each client's editor contents. Under real network latency, clients received stale copies of their own edits, which dropped characters and made cursors jump.

The editor now uses a **Yjs CRDT**. A custom Monaco binding (`frontend/lib/monaco-binding.ts`) turns each keystroke into a small insert/delete operation, and concurrent edits merge deterministically on every client. The Spring server never parses these updates. It acts as a **sequencer**: it numbers each update, broadcasts it in order, and keeps a log so joining clients can catch up (`RoomSyncService`). Clients periodically send a compacted snapshot, which trims the log and is persisted to PostgreSQL. Sequence numbers let a client detect a missed message and resync, and after a reconnect it pushes its full state so offline edits are never lost.

The same channel carries Yjs *awareness* data, which powers live cursors with name labels and the "who's online" avatars. Undo/redo goes through `Y.UndoManager`, so it only reverts your own changes.

### Monaco Editor Integration
Monaco Editor was integrated using an uncontrolled approach to avoid unnecessary React re-renders and improve typing performance.

### React StrictMode Issues
React StrictMode's development behavior caused unexpected WebSocket reconnects. The connection lifecycle was restructured to ensure stability during development and production.

---

## 🌐 Live Demo

**Frontend:**  
https://realtime-collab-editor-two.vercel.app

**Backend:**  
Deployed on Render

---

## 👨‍💻 Author

**Shlok Ghadekar**

GitHub: https://github.com/ShlokGhadekar

LinkedIn: https://www.linkedin.com/in/shlok-ghadekar/

---

## ⭐ Future Improvements

- Redis Pub/Sub for horizontal scaling (the update log is currently in memory, so the backend runs as a single instance)
- Shared terminal support
- Voice collaboration rooms
- File explorer and project workspace support

---

## 📄 License

This project is licensed under the MIT License.
