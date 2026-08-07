import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/schema';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const createNexusClient = (config: SupabaseConfig): SupabaseClient<Database> => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('[NEXUS Database]: Las credenciales de SupabaseUrl o SupabaseAnonKey están ausentes.');
  }

  return createSupabaseClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};