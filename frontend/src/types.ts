export interface UserResponse {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface EmailConfig {
  category: string;
  recipient: string;
  subject: string;
  prompt: string;
  tone: string;
  length: string;
  language: string;
  provider: 'gemini' | 'openai';
}

export interface EmailDraft {
  id?: number; // if loaded from history
  subject: string;
  content: string;
  score_grammar: number;
  score_spam: number;
  score_clarity: number;
  rating?: number;
  is_saved?: boolean;
}

export interface EmailHistoryItem {
  id: number;
  user_id: number;
  category: string;
  recipient: string | null;
  subject: string | null;
  prompt: string;
  content: string;
  tone: string;
  length: string;
  language: string;
  rating: number;
  score_grammar: number;
  score_spam: number;
  score_clarity: number;
  is_saved: boolean;
  created_at: string;
}

export interface AppSettings {
  provider: 'gemini' | 'openai';
  user_gemini_key: string;
  user_openai_key: string;
}

export interface ScoreResponse {
  score_grammar: number;
  score_spam: number;
  score_clarity: number;
  suggestions: string[];
}
