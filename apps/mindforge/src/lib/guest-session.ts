import { GuestProfileManager, GrowthAnalytics } from '@nexus-core/growth';

const GUEST_STORAGE_KEY = 'mf_guest_session_v1';

export interface GuestSession {
  guest_id: string;
  created_at: string;
  matches_played: number;
  last_game_played?: string;
  feedback_submitted: boolean;
}

export function getOrInitGuestSession(): GuestSession {
  if (typeof window === 'undefined') {
    return {
      guest_id: 'guest_server_stub',
      created_at: new Date().toISOString(),
      matches_played: 0,
      feedback_submitted: false,
    };
  }

  const stored = localStorage.getItem(GUEST_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as GuestSession;
    } catch {
      // Si el JSON se corrompe, reiniciamos sesión limpia
    }
  }

  const baseProfile = GuestProfileManager.getOrCreateProfile();
  const newSession: GuestSession = {
    guest_id: baseProfile.guest_id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    matches_played: 0,
    feedback_submitted: false,
  };

  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newSession));
  GrowthAnalytics.getInstance().track(newSession.guest_id, 'onboarding', 'guest_session_created');

  return newSession;
}

export function incrementMatchesPlayed(): GuestSession {
  const session = getOrInitGuestSession();
  session.matches_played += 1;
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session));

  GrowthAnalytics.getInstance().track(session.guest_id, 'gameplay', 'match_completed', {
    matches_played: session.matches_played,
  });

  return session;
}

export function markFeedbackSubmitted(): void {
  const session = getOrInitGuestSession();
  session.feedback_submitted = true;
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(session));
}