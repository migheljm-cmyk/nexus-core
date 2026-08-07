'use client';

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalTimePlayedSeconds: number;
  lastPlayedAt: string | null;
}

export interface UserProfile {
  guestId: string;
  createdAt: string;
  isRegistered: boolean;
  email?: string;
  stats: {
    chess: PlayerStats;
    sudoku: PlayerStats;
    peg: PlayerStats;
  };
}

const GUEST_STORAGE_KEY = 'mf_guest_profile_v1';

function createDefaultProfile(guestId: string): UserProfile {
  const emptyStats = (): PlayerStats => ({
    gamesPlayed: 0,
    gamesWon: 0,
    totalTimePlayedSeconds: 0,
    lastPlayedAt: null,
  });

  return {
    guestId,
    createdAt: new Date().toISOString(),
    isRegistered: false,
    stats: {
      chess: emptyStats(),
      sudoku: emptyStats(),
      peg: emptyStats(),
    },
  };
}

export function getOrCreateGuestSession(): UserProfile {
  if (typeof window === 'undefined') {
    return createDefaultProfile('server_placeholder');
  }

  const stored = localStorage.getItem(GUEST_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Si ocurre un error de parsing, regeneramos una sesión limpia
    }
  }

  const newGuestId = `guest_${crypto.randomUUID()}`;
  const newProfile = createDefaultProfile(newGuestId);
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newProfile));
  return newProfile;
}

export function updatePlayerStats(
  gameId: 'chess' | 'sudoku' | 'peg',
  deltaStats: Partial<PlayerStats>
): UserProfile {
  const profile = getOrCreateGuestSession();
  const currentStats = profile.stats[gameId];

  profile.stats[gameId] = {
    ...currentStats,
    ...deltaStats,
    gamesPlayed: currentStats.gamesPlayed + (deltaStats.gamesPlayed || 0),
    gamesWon: currentStats.gamesWon + (deltaStats.gamesWon || 0),
    totalTimePlayedSeconds:
      currentStats.totalTimePlayedSeconds + (deltaStats.totalTimePlayedSeconds || 0),
    lastPlayedAt: new Date().toISOString(),
  };

  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}