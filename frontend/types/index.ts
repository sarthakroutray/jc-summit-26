// ── Existing types (kept for backward compatibility) ─────

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

// Legacy message types used by retained admin UI components
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

// ── New Voting System Types ──────────────────────────────

export interface VoteQuestion {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
}

export interface VoteOption {
  id: string;
  question_id: string;
  text: string;
  vote_count: number;
}

export interface ActiveQuestionResponse {
  question: VoteQuestion | null;
  options: VoteOption[];
  polling_enabled?: boolean;
}

export interface ResultsResponse {
  question: VoteQuestion | null;
  options: VoteOption[];
  polling_enabled?: boolean;
}

export interface QuestionWithOptions extends VoteQuestion {
  options: VoteOption[];
}

export type ConnectionStatus = 'connected' | 'polling' | 'error';
