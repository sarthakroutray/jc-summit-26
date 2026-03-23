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
