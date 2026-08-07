export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin' | 'executive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'executive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'executive';
          updated_at?: string;
        };
      };
      app_logs: {
        Row: {
          id: string;
          app_id: string;
          level: 'info' | 'warn' | 'error';
          message: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          level: 'info' | 'warn' | 'error';
          message: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          level?: 'info' | 'warn' | 'error';
          message?: string;
          metadata?: Json | null;
        };
      };
    };
  };
}