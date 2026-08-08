import { Logger } from '@nexus/logger';
export * from './telemetry';

// Eventos estandarizados del Event Bus para todo el ecosistema NEXUS CORE
export type CoreEventType =
  | 'page_loaded'
  | 'user_registered'
  | 'session_started'
  | 'game_opened'
  | 'game_started'
  | 'game_finished';

export interface TrackEventOptions {
  eventName: CoreEventType | string; // Permite eventos core estandarizados o eventos custom arbitrarios
  userId?: string;
  properties?: Record<string, unknown>;
}

export class NexusAnalytics {
  private appId: string;
  private logger: Logger;
  private isEnabled: boolean;

  constructor(appId: string, isEnabled = true) {
    this.appId = appId;
    this.isEnabled = isEnabled;
    this.logger = new Logger(`analytics:${appId}`);
  }

  /**
   * Emisión universal de eventos
   */
  track({ eventName, userId, properties }: TrackEventOptions) {
    if (!this.isEnabled) return;

    const payload = {
      appId: this.appId,
      eventName,
      userId: userId || 'anonymous',
      properties: properties || {},
      timestamp: new Date().toISOString(),
    };

    // Registro estructurado respaldado por el motor de @nexus/logger
    this.logger.info(`[Event: ${eventName}]`, payload);

    // Punto de extensión listo para proveedores externos (PostHog, Vercel Analytics, GA4, etc.)
  }

  /**
   * Helper fuertemente tipado para eventos Core de plataforma
   */
  trackCoreEvent(eventName: CoreEventType, userId?: string, properties?: Record<string, unknown>) {
    this.track({
      eventName,
      userId,
      properties,
    });
  }

  /**
   * Telemetría específica para interacciones con el AI Engine
   */
  trackAIInteraction(userId: string, provider: string, tokensUsed: number, latencyMs: number) {
    this.track({
      eventName: 'ai_interaction',
      userId,
      properties: {
        provider,
        tokensUsed,
        latencyMs,
      },
    });
  }
}