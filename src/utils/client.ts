import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Database {
    public: {
      Tables: {
        varsitycamp: {
          Row: {
            id: number;
            suggestion: string;
            likes: number;
            safe: boolean;
            theme: string;
          };
          Insert: {
            suggestion: string;
            safe: boolean;
            tag: string;
          };
          UpdateLikes: {
            id: number;
            likes: number;
          };
          UpdateLabel: {
            id: number;
            theme: string;
          }
        }
      }
    }
  }
  
  export type Suggestions = Database["public"]["Tables"]["varsitycamp"]["Row"];
  export type AddSuggestion = Database["public"]["Tables"]["varsitycamp"]["Insert"];
  export type LikeSuggestion = Database["public"]["Tables"]["varsitycamp"]["UpdateLikes"];
  export type LabelSuggestion = Database["public"]["Tables"]["varsitycamp"]["UpdateLabel"];