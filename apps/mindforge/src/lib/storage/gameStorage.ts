'use client';

export interface UserGamification {
  streakCount: number;
  lastActiveDate: string | null;
  achievements: string[];
}

export interface SavedGameState<T = unknown> {
  gameId: 'chess' | 'sudoku' | 'peg';
  gameMode: 'zen' | 'timed'; // Distinción de modo
  updatedAt: string;
  state: T;
}

const STORAGE_PREFIX = 'mf_saved_state_';
const GAMIFICATION_KEY = 'mf_user_gamification_v1';

/**
 * Guarda el estado activo de un juego específico.
 */
export function saveGameState<T>(
  gameId: 'chess' | 'sudoku' | 'peg',
  state: T,
  gameMode: 'zen' | 'timed' = 'zen'
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: SavedGameState<T> = {
      gameId,
      gameMode,
      updatedAt: new Date().toISOString(),
      state,
    };
    localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, JSON.stringify(payload));
  } catch {
    // Manejo silencioso si el almacenamiento local está deshabilitado
  }
}

/**
 * Recupera el estado guardado de un juego.
 */
export function loadGameState<T>(gameId: 'chess' | 'sudoku' | 'peg'): SavedGameState<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Limpia el estado guardado cuando una partida se completa o reinicia.
 */
export function clearGameState(gameId: 'chess' | 'sudoku' | 'peg'): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${STORAGE_PREFIX}${gameId}`);
}

/**
 * Gestiona y actualiza la racha diaria del usuario (Daily Streak).
 */
export function checkAndUpdateStreak(): UserGamification {
  if (typeof window === 'undefined') {
    return { streakCount: 0, lastActiveDate: null, achievements: [] };
  }

  const stored = localStorage.getItem(GAMIFICATION_KEY);
  let gamification: UserGamification = stored
    ? JSON.parse(stored)
    : { streakCount: 0, lastActiveDate: null, achievements: [] };

  const today = new Date().toISOString().split('T')[0];

  if (!gamification.lastActiveDate) {
    gamification.streakCount = 1;
    gamification.lastActiveDate = today;
  } else if (gamification.lastActiveDate !== today) {
    const lastDate = new Date(gamification.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Día consecutivo
      gamification.streakCount += 1;
    } else if (diffDays > 1) {
      // La racha se rompió
      gamification.streakCount = 1;
    }
    gamification.lastActiveDate = today;
  }

  localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(gamification));
  return gamification;
}