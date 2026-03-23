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

app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>JC Summit — Backend</title>
        <style>
          body { 
            background: #0A0A0F; 
            color: #F0F4FF; 
            font-family: system-ui, -apple-system, sans-serif; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            overflow: hidden;
          }
          .status { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            padding: 12px 24px; 
            background: rgba(255,255,255,0.03); 
            border: 1px solid rgba(255,255,255,0.08); 
            border-radius: 40px;
            backdrop-filter: blur(8px);
          }
          .dot { width: 8px; height: 8px; border-radius: 50%; background: #10B981; box-shadow: 0 0 12px #10B981; animation: pulse 2s infinite; }
          .label { font-size: 11px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; color: #6B7280; }
          @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
          h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
          p { font-size: 13px; color: #6B7280; margin: 0; }
        </style>
      </head>
      <body>
        <div class="status">
          <div class="dot"></div>
          <div class="label">Live</div>
        </div>
        <h1 style="margin-top: 24px;">JC Summit — LiveCards</h1>
        <p>Systems Operational & Connected</p>
      </body>
    </html>
  `);
});

const server = http.createServer(app);
initWebSocket(server);

server.listen(Number(process.env.PORT) || 4000, '0.0.0.0', () => {
  console.log(`LiveCards backend running on port ${process.env.PORT || 4000} (bind 0.0.0.0)`);
});
