import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GameScore {
  id: string;
  user_id: string;
  game_type: string;
  difficulty: string;
  score: number;
  accuracy?: number;
  time_taken?: number;
  created_at: string;
}

export interface UserStats {
  total_games_played: number;
  total_score: number;
  best_score: number;
  average_score: number;
  games_won: number;
}

export interface GameStats {
  lineDrop: { bestScore: number; gamesPlayed: number };
  circleStop: { bestScore: number; gamesPlayed: number };
  gravityTicTacToe: { bestScore: number; gamesPlayed: number };
  wordSprint: { bestScore: number; gamesPlayed: number };
}
