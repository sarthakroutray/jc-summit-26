# JC Summit — LiveCards AI Agent Prompt
### ACM Chapter | Manipal University Jaipur
**Version:** 1.0 | **Stack:** Next.js 16 · Node.js · Express · WebSocket · Supabase

---

> **Instructions for AI Agent:**
> This document is your complete build context. Read every section before writing a single line of code.
> Follow the folder structure exactly. Use the message schema exactly.
> Ask no clarifying questions — all decisions are made here. Build what is written.

---

## 0. What You Are Building

A **real-time question card display system** for **JC Summit**, an event run by the **ACM chapter at Manipal University Jaipur (MUJ)**.

The system has two sides:
- **Admin Panel** (`/admin`) — an ACM organiser sends questions live during the summit
- **Audience Display** (`/`) — questions appear as animated cards on the projector screen in real-time

Questions are persisted in **Supabase** so the board survives server restarts and organisers can resume a session. The WebSocket layer is a custom Node.js + Express + `ws` server (not Next.js API routes) because Next.js serverless functions do not support persistent WebSocket connections.

---

## 1. Branding & Identity

| Field | Value |
|---|---|
| Event Name | JC Summit |
| Organisation | ACM — Manipal University Jaipur |
| Primary Color | `#0066CC` (ACM blue) |
| Accent Color | `#00B4D8` (electric cyan) |
| Background | `#0A0A0F` (near-black) |
| Card Background | `#12121A` |
| Text Primary | `#F0F4FF` |
| Text Muted | `#6B7280` |
| Font — Display | `Space Grotesk` (Google Fonts) |
| Font — Body | `Inter` (Google Fonts) |
| Design Aesthetic | Dark terminal / conference stage — clean, professional, projector-safe |
| Logo Usage | Show "ACM" wordmark + "JC Summit" title on audience display header |

> The audience display will be projected on a large screen in a conference hall.
> Design for readability at distance: large type, high contrast, generous spacing.

---

## 2. Repository Structure

```
jc-summit-livecards/
├── frontend/                  ← Next.js 16 App
│   ├── app/
│   │   ├── layout.tsx         ← Root layout, fonts, metadata
│   │   ├── page.tsx           ← Audience display ( / )
│   │   ├── admin/
│   │   │   └── page.tsx       ← Admin panel ( /admin )
│   │   └── globals.css
│   ├── components/
│   │   ├── QuestionCard.tsx   ← Animated card component
│   │   ├── CardGrid.tsx       ← Responsive grid layout
│   │   ├── AdminForm.tsx      ← Question input form
│   │   ├── SessionBar.tsx     ← Active session controls
│   │   ├── StatusDot.tsx      ← WS connection indicator
│   │   └── AcmHeader.tsx      ← ACM + JC Summit branded header
│   ├── hooks/
│   │   ├── useWebSocket.ts    ← WS connection + auto-reconnect
│   │   └── useQuestions.ts    ← Question state + REST hydration
│   ├── lib/
│   │   └── api.ts             ← Fetch wrapper for backend REST
│   ├── types/
│   │   └── index.ts           ← Shared TypeScript types
│   ├── public/
│   │   └── acm-logo.svg       ← ACM logo asset
│   ├── .env.local
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                   ← Node.js + Express + WS server
│   ├── src/
│   │   ├── server.ts          ← Entry point
│   │   ├── websocket.ts       ← WS server, client registry, broadcast
│   │   ├── routes/
│   │   │   ├── questions.ts   ← REST: questions CRUD
│   │   │   └── sessions.ts    ← REST: session management
│   │   ├── db/
│   │   │   └── supabase.ts    ← Supabase client init
│   │   └── middleware/
│   │       └── adminAuth.ts   ← Secret token validation
│   ├── .env
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

---

## 3. Database Schema (Supabase / PostgreSQL)

Run this SQL in the Supabase SQL editor exactly as written:

```sql
-- Sessions table
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  created_at  timestamptz default now(),
  is_active   boolean default true,
  cleared_at  timestamptz
);

-- Questions table
create table questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade not null,
  text        text not null check (char_length(text) <= 300),
  category    text,
  color       text,
  order_index integer not null default 0,
  is_deleted  boolean default false,
  created_at  timestamptz default now()
);

-- Index for fast session lookups
create index idx_questions_session_id on questions(session_id);
create index idx_questions_created_at on questions(created_at desc);

-- Disable RLS (backend-only access via service_role key)
alter table sessions disable row level security;
alter table questions disable row level security;
```

---

## 4. TypeScript Types (`frontend/types/index.ts`)

```typescript
export interface Session {
  id: string;
  title: string;
  created_at: string;
  is_active: boolean;
  cleared_at: string | null;
}

export interface Question {
  id: string;
  session_id: string;
  text: string;
  category: string | null;
  color: string | null;
  order_index: number;
  is_deleted: boolean;
  created_at: string;
}

// WebSocket message types
export type WsMessageType =
  | 'new_question'
  | 'delete_question'
  | 'clear_session'
  | 'question_added'
  | 'question_deleted'
  | 'session_cleared'
  | 'connected'
  | 'error';

export interface WsMessage {
  type: WsMessageType;
  secret?: string;           // admin messages only
  sessionId?: string;
  questionId?: string;
  question?: Question;
  text?: string;
  category?: string;
  color?: string;
}

export type WsStatus = 'connecting' | 'open' | 'closed' | 'error';
```

---

## 5. Environment Variables

### Backend (`backend/.env`)
```env
PORT=4000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ADMIN_SECRET=jc-summit-acm-secret-2026
CLIENT_ORIGIN=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ADMIN_SECRET=jc-summit-acm-secret-2026
NEXT_PUBLIC_DEFAULT_SESSION_ID=replace-with-session-uuid-after-creation
```

> ⚠️ `NEXT_PUBLIC_ADMIN_SECRET` is acceptable for v1 (internal tool, URL not public).
> For production, move admin auth to a server-side Next.js route that checks a cookie.

---

## 6. Backend Implementation

### `backend/src/db/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### `backend/src/middleware/adminAuth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-secret'];
  if (token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

### `backend/src/websocket.ts` — Full Logic

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { supabase } from './db/supabase';
import { WsMessage } from '../../frontend/types'; // or duplicate the types here

const clients = new Set<WebSocket>();

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  // Ping interval to detect dead connections
  const pingInterval = setInterval(() => {
    clients.forEach(ws => {
      if ((ws as any).isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(pingInterval));

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // Origin check
    const origin = req.headers.origin;
    if (origin && origin !== process.env.CLIENT_ORIGIN) {
      ws.close(1008, 'Origin not allowed');
      return;
    }

    (ws as any).isAlive = true;
    ws.on('pong', () => { (ws as any).isAlive = true; });
    clients.add(ws);

    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('message', async (raw) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // All mutating messages require admin secret
      if (['new_question', 'delete_question', 'clear_session'].includes(msg.type)) {
        if (msg.secret !== process.env.ADMIN_SECRET) {
          ws.send(JSON.stringify({ type: 'error', text: 'Unauthorized' }));
          return;
        }
      }

      if (msg.type === 'new_question' && msg.sessionId && msg.text) {
        // Get current max order_index for session
        const { data: existing } = await supabase
          .from('questions')
          .select('order_index')
          .eq('session_id', msg.sessionId)
          .order('order_index', { ascending: false })
          .limit(1);

        const order_index = existing && existing.length > 0
          ? existing[0].order_index + 1 : 0;

        const { data, error } = await supabase
          .from('questions')
          .insert({
            session_id: msg.sessionId,
            text: msg.text.trim().slice(0, 300),
            category: msg.category || null,
            color: msg.color || null,
            order_index
          })
          .select()
          .single();

        if (error || !data) {
          ws.send(JSON.stringify({ type: 'error', text: 'DB write failed' }));
          return;
        }

        broadcast({ type: 'question_added', question: data });
      }

      if (msg.type === 'delete_question' && msg.questionId) {
        await supabase
          .from('questions')
          .update({ is_deleted: true })
          .eq('id', msg.questionId);

        broadcast({ type: 'question_deleted', questionId: msg.questionId });
      }

      if (msg.type === 'clear_session' && msg.sessionId) {
        await supabase
          .from('questions')
          .update({ is_deleted: true })
          .eq('session_id', msg.sessionId);

        await supabase
          .from('sessions')
          .update({ cleared_at: new Date().toISOString() })
          .eq('id', msg.sessionId);

        broadcast({ type: 'session_cleared', sessionId: msg.sessionId });
      }
    });

    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });
}

function broadcast(msg: object) {
  const payload = JSON.stringify(msg);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}
```

### `backend/src/routes/questions.ts`
```typescript
import { Router } from 'express';
import { supabase } from '../db/supabase';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// GET /api/questions?session_id=UUID
router.get('/', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('session_id', session_id)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/questions/:id  (soft delete)
router.delete('/:id', adminAuth, async (req, res) => {
  const { error } = await supabase
    .from('questions')
    .update({ is_deleted: true })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
```

### `backend/src/routes/sessions.ts`
```typescript
import { Router } from 'express';
import { supabase } from '../db/supabase';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// GET /api/sessions
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/sessions
router.post('/', adminAuth, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  // Deactivate all other sessions
  await supabase.from('sessions').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabase
    .from('sessions')
    .insert({ title, is_active: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
```

### `backend/src/server.ts`
```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { initWebSocket } from './websocket';
import questionsRouter from './routes/questions';
import sessionsRouter from './routes/sessions';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api/questions', questionsRouter);
app.use('/api/sessions', sessionsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
initWebSocket(server);

server.listen(Number(process.env.PORT) || 4000, () => {
  console.log(`LiveCards backend running on port ${process.env.PORT || 4000}`);
});
```

### `backend/package.json`
```json
{
  "name": "jc-summit-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/ws": "^8.5.12",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

---

## 7. Frontend Implementation

### `frontend/package.json`
```json
{
  "name": "jc-summit-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "framer-motion": "^11.0.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0"
  }
}
```

### `frontend/next.config.ts`
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output for Railway/Render deployment
  output: 'standalone',
  // No API proxying needed — WS is on separate backend
};

export default nextConfig;
```

### `frontend/app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JC Summit — LiveCards | ACM MUJ',
  description: 'Real-time question display for JC Summit by ACM Manipal University Jaipur',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-[#0A0A0F] text-[#F0F4FF] antialiased">
        {children}
      </body>
    </html>
  );
}
```

### `frontend/hooks/useWebSocket.ts`
```typescript
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { WsMessage, WsStatus } from '../types';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

interface UseWebSocketOptions {
  onMessage: (msg: WsMessage) => void;
}

export function useWebSocket({ onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const [status, setStatus] = useState<WsStatus>('connecting');

  // Keep callback ref fresh without re-running the effect
  useEffect(() => { onMessageRef.current = onMessage; });

  const connect = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL!;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      setStatus('open');
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      setStatus('closed');
      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++;
        setTimeout(connect, RETRY_DELAY_MS);
      }
    };

    ws.onerror = () => {
      setStatus('error');
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((data: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { sendMessage, status };
}
```

### `frontend/hooks/useQuestions.ts`
```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Question, WsMessage } from '../types';

export function useQuestions(sessionId: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // REST hydration on mount — MUST complete before WS subscribes
  useEffect(() => {
    if (!sessionId) { setIsLoading(false); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions?session_id=${sessionId}`)
      .then(r => r.json())
      .then((data: Question[]) => {
        setQuestions(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [sessionId]);

  // Called by useWebSocket onMessage handler
  const handleWsMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case 'question_added':
        if (msg.question) {
          setQuestions(prev => [msg.question!, ...prev]);
        }
        break;
      case 'question_deleted':
        if (msg.questionId) {
          setQuestions(prev => prev.filter(q => q.id !== msg.questionId));
        }
        break;
      case 'session_cleared':
        setQuestions([]);
        break;
    }
  }, []);

  return { questions, isLoading, error, handleWsMessage };
}
```

### `frontend/components/QuestionCard.tsx`
```typescript
'use client';
import { motion } from 'framer-motion';
import type { Question } from '../types';

interface Props {
  question: Question;
  index: number;
  isNew?: boolean;
  onDelete?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Technical': '#0066CC',
  'General':   '#0EA5E9',
  'Panel':     '#8B5CF6',
  'Lightning': '#F59E0B',
};

export function QuestionCard({ question, index, isNew = false, onDelete }: Props) {
  const accent = question.color ||
    (question.category ? CATEGORY_COLORS[question.category] : '#0066CC');

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: 32, scale: 0.96 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="relative rounded-xl border border-white/10 bg-[#12121A] p-5 overflow-hidden"
      style={{ borderLeftColor: accent, borderLeftWidth: '3px' }}
    >
      {/* Card index badge */}
      <span className="absolute top-4 right-4 text-xs font-mono text-white/20">
        #{String(index + 1).padStart(2, '0')}
      </span>

      {/* Category badge */}
      {question.category && (
        <span
          className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {question.category}
        </span>
      )}

      {/* Question text */}
      <p className="font-display text-lg leading-snug text-[#F0F4FF] pr-8">
        {question.text}
      </p>

      {/* Timestamp */}
      <p className="mt-3 text-xs text-[#6B7280]">
        {new Date(question.created_at).toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit'
        })}
      </p>

      {/* Admin delete button */}
      {onDelete && (
        <button
          onClick={() => onDelete(question.id)}
          className="absolute bottom-4 right-4 text-xs text-[#6B7280] hover:text-red-400 transition-colors"
        >
          Remove
        </button>
      )}

      {/* Subtle gradient shimmer on new cards */}
      {isNew && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${accent}11, transparent)` }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />
      )}
    </motion.div>
  );
}
```

### `frontend/components/AcmHeader.tsx`
```typescript
export function AcmHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
      <div className="flex items-center gap-3">
        {/* ACM diamond logo mark */}
        <div className="w-8 h-8 rotate-45 bg-[#0066CC] flex items-center justify-center">
          <div className="w-4 h-4 rotate-0 bg-[#0A0A0F]" />
        </div>
        <div>
          <p className="text-xs font-mono text-[#0066CC] tracking-widest uppercase">ACM — MUJ</p>
          <h1 className="font-display text-xl font-bold text-[#F0F4FF] leading-none">
            JC Summit
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-[#6B7280] font-mono">LIVE</span>
      </div>
    </header>
  );
}
```

### `frontend/components/StatusDot.tsx`
```typescript
import type { WsStatus } from '../types';

const STATUS_CONFIG = {
  open:       { color: 'bg-green-500',  label: 'Live' },
  connecting: { color: 'bg-yellow-500', label: 'Connecting...' },
  closed:     { color: 'bg-red-500',    label: 'Reconnecting' },
  error:      { color: 'bg-red-500',    label: 'Disconnected' },
};

export function StatusDot({ status }: { status: WsStatus }) {
  const { color, label } = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color} ${status === 'open' ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-mono text-[#6B7280]">{label}</span>
    </div>
  );
}
```

### `frontend/app/page.tsx` — Audience Display
```typescript
'use client';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { AcmHeader } from '../components/AcmHeader';
import { QuestionCard } from '../components/QuestionCard';
import { StatusDot } from '../components/StatusDot';
import { useQuestions } from '../hooks/useQuestions';
import { useWebSocket } from '../hooks/useWebSocket';

export default function AudiencePage() {
  const params = useSearchParams();
  const sessionId = params.get('session') ||
    process.env.NEXT_PUBLIC_DEFAULT_SESSION_ID || '';

  const { questions, isLoading, handleWsMessage } = useQuestions(sessionId);
  const { status } = useWebSocket({ onMessage: handleWsMessage });

  return (
    <div className="min-h-screen flex flex-col">
      <AcmHeader />

      {/* Status bar */}
      <div className="flex items-center justify-between px-8 py-2 border-b border-white/5 bg-black/20">
        <span className="text-xs font-mono text-[#6B7280]">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </span>
        <StatusDot status={status} />
      </div>

      {/* Card grid */}
      <main className="flex-1 p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="font-mono text-[#6B7280] text-sm animate-pulse">
              Loading session...
            </p>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-12 h-12 rotate-45 border-2 border-[#0066CC]/30" />
            <p className="font-display text-[#6B7280] text-lg">
              Waiting for questions...
            </p>
            <p className="text-xs font-mono text-[#6B7280]/60">
              Questions will appear here in real-time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
            <AnimatePresence mode="popLayout">
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  isNew={i === 0}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
```

### `frontend/app/admin/page.tsx` — Admin Panel
```typescript
'use client';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { QuestionCard } from '../../components/QuestionCard';
import { StatusDot } from '../../components/StatusDot';
import { useQuestions } from '../../hooks/useQuestions';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { WsMessage } from '../../types';

const CATEGORIES = ['Technical', 'General', 'Panel', 'Lightning'];
const COLORS = ['#0066CC', '#0EA5E9', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'];

export default function AdminPage() {
  const sessionId = process.env.NEXT_PUBLIC_DEFAULT_SESSION_ID || '';
  const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET || '';

  const { questions, handleWsMessage } = useQuestions(sessionId);
  const { sendMessage, status } = useWebSocket({ onMessage: handleWsMessage });

  const [text, setText] = useState('');
  const [category, setCategory] = useState('General');
  const [color, setColor] = useState(COLORS[0]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 300) return;
    const msg: WsMessage = {
      type: 'new_question',
      secret,
      sessionId,
      text: trimmed,
      category,
      color,
    };
    sendMessage(msg);
    setText('');
  };

  const deleteQuestion = (id: string) => {
    sendMessage({ type: 'delete_question', secret, questionId: id });
  };

  const clearBoard = () => {
    if (!confirm('Clear all questions from the board?')) return;
    sendMessage({ type: 'clear_session', secret, sessionId });
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-mono text-[#0066CC] tracking-widest uppercase mb-1">
            ACM — MUJ / JC Summit
          </p>
          <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
        </div>
        <StatusDot status={status} />
      </div>

      {/* Form */}
      <div className="bg-[#12121A] rounded-xl border border-white/10 p-6 mb-8">
        <h2 className="font-display text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
          New Question
        </h2>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your question here..."
          rows={3}
          maxLength={300}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3
                     text-[#F0F4FF] placeholder-[#6B7280] font-body text-sm
                     focus:outline-none focus:border-[#0066CC]/60 resize-none mb-4"
        />

        <div className="flex flex-wrap gap-4 items-end">
          {/* Category */}
          <div>
            <label className="text-xs text-[#6B7280] block mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2
                         text-sm text-[#F0F4FF] focus:outline-none focus:border-[#0066CC]/60"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-[#6B7280] block mb-1">Accent</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white/30 ring-offset-2 ring-offset-[#12121A]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Send */}
          <button
            onClick={send}
            disabled={!text.trim() || status !== 'open'}
            className="ml-auto px-6 py-2 bg-[#0066CC] hover:bg-[#0052A3]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       text-white font-display text-sm font-semibold rounded-lg transition-colors"
          >
            Send Question
          </button>
        </div>

        <p className="text-xs text-[#6B7280] mt-2 text-right">
          {text.length}/300
        </p>
      </div>

      {/* Live log */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm font-semibold text-[#6B7280] uppercase tracking-wider">
          Live Board ({questions.length})
        </h2>
        {questions.length > 0 && (
          <button
            onClick={clearBoard}
            className="text-xs text-red-400 hover:text-red-300 transition-colors font-mono"
          >
            Clear Board
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              isNew={i === 0}
              onDelete={deleteQuestion}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

### `frontend/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
}

.font-display { font-family: var(--font-display); }
.font-body    { font-family: var(--font-body); }

/* Smooth scrollbar for card grid */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0A0A0F; }
::-webkit-scrollbar-thumb { background: #1F2937; border-radius: 2px; }
```

### `frontend/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 8. Deployment

### Backend — Railway
```bash
# In Railway dashboard:
# 1. New project → Deploy from GitHub → select backend/
# 2. Set all env vars from backend/.env
# 3. Start command: npm start
# 4. Railway gives you a URL: https://jc-summit-backend.up.railway.app
```

### Frontend — Vercel
```bash
# 1. Push to GitHub
# 2. Import in Vercel → set root directory to frontend/
# 3. Add env vars (NEXT_PUBLIC_WS_URL=wss://..., NEXT_PUBLIC_API_URL=https://...)
# 4. Deploy
```

### Running Locally
```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
# Opens at http://localhost:3000

# Audience view: http://localhost:3000/?session=YOUR_SESSION_ID
# Admin view:    http://localhost:3000/admin
```

---

## 9. Build Order (Agent Execution Order)

Execute in this exact order. Do not skip ahead.

1. **Supabase** — create project, run schema SQL, copy URL + service_role key
2. **Backend: Supabase client** — `src/db/supabase.ts`
3. **Backend: Middleware + Routes** — adminAuth, questions, sessions
4. **Backend: WebSocket** — `src/websocket.ts` with full broadcast logic
5. **Backend: Server entry** — `src/server.ts`, test with `curl localhost:4000/health`
6. **Frontend: Types** — `types/index.ts`
7. **Frontend: Hooks** — `useWebSocket.ts` then `useQuestions.ts`
8. **Frontend: Components** — `AcmHeader`, `StatusDot`, `QuestionCard`, `CardGrid`, `AdminForm`
9. **Frontend: Pages** — `app/layout.tsx`, `app/page.tsx`, `app/admin/page.tsx`
10. **End-to-end test** — open admin, send question, confirm it appears on audience view

---

## 10. Known Edge Cases to Handle

| Case | Expected Behaviour |
|---|---|
| New audience member joins mid-session | REST fetch hydrates all existing questions, then WS subscribes |
| Server restarts | Questions survive (Supabase). Clients auto-reconnect via hook retry logic |
| Admin sends during WS reconnect | Button is disabled when `status !== 'open'` |
| Question text > 300 chars | Sliced server-side before DB write; client also shows char counter |
| Two admins open simultaneously | Both receive broadcasts; last write wins for DB |
| Mobile audience | 1-column responsive grid, large text, touch-friendly |

---

## 11. Do Not

- Do NOT use Next.js API routes for WebSocket — they do not support persistent connections
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` in any `NEXT_PUBLIC_` variable
- Do NOT use Socket.io — use the native `ws` package as specified
- Do NOT add user authentication to the audience view — it must be frictionless
- Do NOT use `dangerouslySetInnerHTML` for question text
- Do NOT use `pages/` router — use App Router (`app/`) exclusively

---

*End of AI Agent Prompt — JC Summit LiveCards v1.0*
*ACM Chapter | Manipal University Jaipur*
