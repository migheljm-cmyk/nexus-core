export interface GuestProfileData {
  guest_id: string;
  created_at: string;
  last_seen_at: string;
  favorite_games: string[];
  total_play_time_seconds: number;
  matches_played: number;
  wins: number;
  losses: number;
  streak: number;
}

const GUEST_KEY = 'mf_guest_profile_v1';

export class GuestProfileManager {
  public static getOrCreateProfile(): GuestProfileData {
    if (typeof window === 'undefined') {
      return this.generateDefaultProfile('');
    }

    const stored = localStorage.getItem(GUEST_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as GuestProfileData;
        parsed.last_seen_at = new Date().toISOString();
        localStorage.setItem(GUEST_KEY, JSON.stringify(parsed));
        return parsed;
      } catch {
        // En caso de corrupción local, regenerar manteniendo ID si es posible
      }
    }

    const newProfile = this.generateDefaultProfile(crypto.randomUUID());
    localStorage.setItem(GUEST_KEY, JSON.stringify(newProfile));
    return newProfile;
  }

  public static updateProfile(updates: Partial<GuestProfileData>): GuestProfileData {
    const current = this.getOrCreateProfile();
    const updated = {
      ...current,
      ...updates,
      last_seen_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    }
    return updated;
  }

  private static generateDefaultProfile(id: string): GuestProfileData {
    const now = new Date().toISOString();
    return {
      guest_id: id,
      created_at: now,
      last_seen_at: now,
      favorite_games: [],
      total_play_time_seconds: 0,
      matches_played: 0,
      wins: 0,
      losses: 0,
      streak: 0,
    };
  }
}