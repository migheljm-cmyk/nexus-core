export interface AuditLogEvent {
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private static endpoint = '/api/audit'; // Endpoint que registrará en Supabase

  /**
   * Emite un evento de auditoría de forma asíncrona.
   */
  static async log(event: AuditLogEvent): Promise<void> {
    try {
      // Telemetría / Log en consola para entorno de desarrollo
      console.log(`[AUDIT] [${event.action}] ${event.resource}`, {
        user: event.userEmail || 'GUEST',
        metadata: event.metadata,
      });

      // Envío hacia el endpoint de auditoría empresarial
      if (typeof window !== 'undefined') {
        fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => console.error('[AUDIT_ERROR] Failed to dispatch log:', err));
      }
    } catch (error) {
      console.error('[AUDIT_ERROR]', error);
    }
  }
}