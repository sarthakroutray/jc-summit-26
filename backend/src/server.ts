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
