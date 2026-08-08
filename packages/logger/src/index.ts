export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogPayload {
  appId: string;
  message: string;
  level?: LogLevel;
  metadata?: Record<string, unknown>;
}

export class Logger {
  private appId: string;

  constructor(appId: string) {
    this.appId = appId;
  }

  /**
   * Procesa metadata para extraer correctamente las propiedades de un objeto Error
   * y ocultar información sensible básica.
   */
  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const cleaned: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Redactar llaves sensibles comunes
      if (/password|token|secret|authorization/i.test(key)) {
        cleaned[key] = '[REDACTED]';
      } 
      // Formatear instancias de Error
      else if (value instanceof Error) {
        cleaned[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      } 
      else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  private format(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const cleanedMetadata = this.sanitizeMetadata(metadata);

    return {
      timestamp: new Date().toISOString(),
      appId: this.appId,
      level: level.toUpperCase(),
      message,
      ...(cleanedMetadata ? { metadata: cleanedMetadata } : {}),
    };
  }

  info(message: string, metadata?: Record<string, unknown>) {
    console.log(JSON.stringify(this.format('info', message, metadata)));
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    console.warn(JSON.stringify(this.format('warn', message, metadata)));
  }

  error(message: string, metadata?: Record<string, unknown>) {
    console.error(JSON.stringify(this.format('error', message, metadata)));
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    // Verificación segura del entorno a través de globalThis para evitar fallos de TypeScript
    const globalProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
    const isProduction = globalProcess?.env?.NODE_ENV === 'production';

    if (!isProduction) {
      console.debug(JSON.stringify(this.format('debug', message, metadata)));
    }
  }
}