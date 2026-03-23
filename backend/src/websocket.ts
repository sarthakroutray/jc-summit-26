import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { supabase } from './db/supabase';

interface WsMessage {
  type: string;
  secret?: string;
  sessionId?: string;
  questionId?: string;
  text?: string;
  category?: string;
  color?: string;
  [key: string]: unknown;
}

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
