'use client';

import { useState, useEffect } from 'react';
import {
  UserProfile,
  getOrCreateGuestSession,
  updatePlayerStats,
} from '../lib/auth/guestSession';

export function useGuestSession() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const userProfile = getOrCreateGuestSession();
    setProfile(userProfile);
  }, []);

  const recordGameActivity = (
    gameId: 'chess' | 'sudoku' | 'peg',
    delta: { gamesPlayed?: number; gamesWon?: number; timePlayedSeconds?: number }
  ) => {
    const updated = updatePlayerStats(gameId, {
      gamesPlayed: delta.gamesPlayed || 0,
      gamesWon: delta.gamesWon || 0,
      totalTimePlayedSeconds: delta.timePlayedSeconds || 0,
    });
    setProfile(updated);
  };

  return {
    profile,
    guestId: profile?.guestId || null,
    recordGameActivity,
  };
}