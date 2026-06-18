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
- Tailwind CSS

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

Create a `.env` file:

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/collabeditor
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password

JWT_SECRET=your_secret_key

JDOODLE_CLIENT_ID=your_client_id
JDOODLE_CLIENT_SECRET=your_client_secret
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

---

## 🧠 Engineering Challenges

### WebSocket Authentication
JWT authentication does not automatically propagate to WebSocket connections. A custom STOMP interceptor validates tokens before establishing WebSocket sessions.

### Real-Time Synchronization
Managing concurrent edits while maintaining a smooth user experience required debounced update handling and efficient WebSocket messaging.

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

- Operational Transformation (OT) / CRDT-based conflict resolution
- Redis Pub/Sub for horizontal scaling
- Shared terminal support
- Voice collaboration rooms
- File explorer and project workspace support
- Presence indicators and cursor tracking

---

## 📄 License

This project is licensed under the MIT License.
