# JC Summit — LiveCards 🚀

A premium, real-time question display system developed for **ACM MUJ** events. Built with a focus on high-agency design, cinematic animations, and instant WebSocket synchronization.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![Express](https://img.shields.io/badge/Express-4.21-green.svg)
![WebSocket](https://img.shields.io/badge/WebSocket-WS-orange.svg)

---

## ✨ Features

- 💎 **Premium Aesthetic**: Dark mode, Apple Music-inspired glassmorphism, and abstract animated backgrounds.
- ⚡ **Real-Time Synchronisation**: Instant question broadcasting via custom WebSocket implementation.
- 🔒 **Secure Admin Panel**: Password-protected dashboard for clear-board, question deletion, and live moderation.
- 🌪️ **Cinematic UI**: Text scrambling, spring physics card animations, and liquid-glass borders (powered by Framer Motion).
- 🗄️ **Supabase Integration**: Permanent data persistence using PostgreSQL with ultra-low latency response times.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + Vanilla CSS (Variables)
- **Animations**: Framer Motion
- **Communication**: Custom `useWebSocket` hook with auto-reconnect

### Backend
- **Engine**: Node.js & Express
- **Real-time**: `ws` (WebSocket)
- **Database**: Supabase (PostgreSQL)
- **Security**: Secret-key based authentication middleware

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Project (URL & Service Role Key)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ronitdoes/jc-summit-26.git
   cd jc-summit-26
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Create a .env.local with:
   # NEXT_PUBLIC_WS_URL=ws://localhost:4000
   # NEXT_PUBLIC_API_URL=http://localhost:4000
   # NEXT_PUBLIC_ADMIN_SECRET=your_admin_secret
   # NEXT_PUBLIC_DEFAULT_SESSION_ID=your_session_uuid
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd ../backend
   npm install
   # Create a .env with:
   # PORT=4000
   # SUPABASE_URL=your_supabase_url
   # SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   # ADMIN_SECRET=your_admin_secret
   # CLIENT_ORIGIN=http://localhost:3000
   npm run dev
   ```

---


## 🏆 Credits

Developed by **ACM Student Chapter — Manipal University Jaipur**.
