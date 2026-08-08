import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { Logger } from '@nexus/logger';
import { Database } from '../types/schema';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const logger = new Logger('database');

export const createNexusClient = (config: SupabaseConfig): SupabaseClient<Database> => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    const errorMsg = '[NEXUS Database]: Las credenciales de SupabaseUrl o SupabaseAnonKey están ausentes.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info('Cliente de base de datos de Supabase inicializado correctamente.');

  return createSupabaseClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};