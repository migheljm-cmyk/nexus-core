declare const process: { env: { [key: string]: string | undefined } };
export type TelemetryEventType =
  | 'game_first_open'
  | 'game_completed'
  | 'game_abandoned'
  | 'session_duration'
  | 'game_transition'
  | 'user_return';

export interface TelemetryEvent {
  event_type: TelemetryEventType;
  user_id: string; // guest_id o auth_id
  game_id?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ExecutiveMetrics {
  dailyActiveUsers: number;
  favoriteGame: string;
  avgSessionDurationMinutes: number;
  retentionRatePercentage: number;
  totalSessions: number;
  topAbandonmentGame: string;
}

export class EnterpriseTelemetryEngine {
  private static instance: EnterpriseTelemetryEngine;

  private constructor() {}

  public static getInstance(): EnterpriseTelemetryEngine {
    if (!EnterpriseTelemetryEngine.instance) {
      EnterpriseTelemetryEngine.instance = new EnterpriseTelemetryEngine();
    }
    return EnterpriseTelemetryEngine.instance;
  }

  /**
   * Emite un evento de telemetría de alto nivel hacia el almacenamiento de eventos (Supabase/DB).
   */
  public async logEvent(event: Omit<TelemetryEvent, 'timestamp'>): Promise<void> {
    const payload: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[EnterpriseTelemetry]', payload);
    }

    // Aquí se conecta con el cliente de Supabase (nexus-mindforge -> analytics_events)
  }

  /**
   * Obtiene la vista agregada para el Dashboard Ejecutivo (Épica 4).
   */
  public async getExecutiveMetrics(): Promise<ExecutiveMetrics> {
    // Stub de agregación / Mock estructurado listo para conectar a RPC de Supabase
    return {
      dailyActiveUsers: 142,
      favoriteGame: 'Memoria Cuántica',
      avgSessionDurationMinutes: 4.8,
      retentionRatePercentage: 68.5,
      totalSessions: 520,
      topAbandonmentGame: 'Reflejos Alfa',
    };
  }
}