declare const process: { env: { [key: string]: string | undefined } };
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

  private format(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    return {
      timestamp: new Date().toISOString(),
      appId: this.appId,
      level: level.toUpperCase(),
      message,
      ...(metadata ? { metadata } : {}),
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
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify(this.format('debug', message, metadata)));
    }
  }
}