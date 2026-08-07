import { AnalyticsPayload, EventCategory, EventName } from '../types/events';

interface GrowthConfig {
  endpoint: string;
  batchSize?: number;
  flushIntervalMs?: number;
}

export class GrowthAnalytics {
  private static instance: GrowthAnalytics;
  private queue: AnalyticsPayload[] = [];
  private endpoint: string = '';
  private batchSize: number = 10;
  private flushIntervalMs: number = 5000;
  private timer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): GrowthAnalytics {
    if (!GrowthAnalytics.instance) {
      GrowthAnalytics.instance = new GrowthAnalytics();
    }
    return GrowthAnalytics.instance;
  }

  public init(config: GrowthConfig) {
    this.endpoint = config.endpoint;
    this.batchSize = config.batchSize ?? 10;
    this.flushIntervalMs = config.flushIntervalMs ?? 5000;

    if (typeof window !== 'undefined') {
      this.startTimer();
      window.addEventListener('beforeunload', () => this.flush(true));
    }
  }

  public track(
    guestId: string,
    category: EventCategory,
    eventName: EventName,
    metadata: Record<string, unknown> = {}
  ): void {
    const payload: AnalyticsPayload = {
      guest_id: guestId,
      category,
      event_name: eventName,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(payload);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  public async flush(useBeacon: boolean = false): Promise<void> {
    if (this.queue.length === 0 || !this.endpoint) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    const body = JSON.stringify({ events: eventsToSend });

    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, body);
      return;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        // Si hay error en el servidor, reencolar los eventos
        this.queue.unshift(...eventsToSend);
      }
    } catch {
      // Reintentar en la siguiente ráfaga en caso de desconexión
      this.queue.unshift(...eventsToSend);
    }
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
  }
}