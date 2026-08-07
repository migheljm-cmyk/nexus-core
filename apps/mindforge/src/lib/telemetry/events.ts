'use client';

import { getOrCreateGuestSession } from '../auth/guestSession';

export type GameId = 'chess' | 'sudoku' | 'peg';

export type EventType =
  | 'game_start'
  | 'game_complete'
  | 'move_made'
  | 'board_reset'
  | 'ad_impression'
  | 'ad_click'; // <-- Añadido el tipo de evento para clics en anuncios

export interface TelemetryPayload {
  eventId: string;
  guestId: string;
  gameId: GameId;
  eventType: EventType;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

const TELEMETRY_STORAGE_KEY = 'mf_telemetry_events_v1';

export function trackEvent(
  gameId: GameId,
  eventType: EventType,
  metadata?: Record<string, unknown>
): TelemetryPayload {
  const user = getOrCreateGuestSession();

  const payload: TelemetryPayload = {
    eventId: `evt_${crypto.randomUUID()}`,
    guestId: user.guestId,
    gameId,
    eventType,
    metadata,
    timestamp: Date.now(),
  };

  // Persistir evento localmente para el panel del Dashboard
  if (typeof window === 'undefined') return payload;

  try {
    const stored = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const events: TelemetryPayload[] = stored ? JSON.parse(stored) : [];
    
    // Mantener los últimos 500 eventos en búfer local
    events.push(payload);
    if (events.length > 500) events.shift();

    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(events));

    // Log de desarrollo para depuración inmediata en consola
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [Telemetry] ${eventType}:`, payload);
    }
  } catch {
    // Ignorar fallos de cuota o parseo
  }

  return payload;
}

export function getStoredTelemetryEvents(): TelemetryPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}