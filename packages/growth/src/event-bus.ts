import { Logger } from '@nexus/logger';

export type EventCallback<T = any> = (payload: T) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private logger = new Logger('event-bus');

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retorna función de desuscripción limpia (Unsubscribe)
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  public async publish<T = any>(event: string, payload: T): Promise<void> {
    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.size === 0) return;

    this.logger.info(`Evento emitido: ${event}`, { payload });

    const promises = Array.from(callbacks).map(async (callback) => {
      try {
        await callback(payload);
      } catch (error) {
        this.logger.error(`Error procesando evento [${event}]`, { error });
      }
    });

    await Promise.all(promises);
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = EventBus.getInstance();