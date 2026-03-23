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
  secret?: string;
  sessionId?: string;
  questionId?: string;
  question?: Question;
  text?: string;
  category?: string;
  color?: string;
}

export type WsStatus = 'connecting' | 'open' | 'closed' | 'error';
