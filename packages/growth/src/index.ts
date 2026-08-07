// nexus-core/packages/growth/src/index.ts

// ────────── Clases de Gestión de Invitados y Métricas Existentes ──────────
export class GrowthAnalytics {
  private static instance: GrowthAnalytics;

  private constructor() {}

  public static getInstance(): GrowthAnalytics {
    if (!GrowthAnalytics.instance) {
      GrowthAnalytics.instance = new GrowthAnalytics();
    }
    return GrowthAnalytics.instance;
  }

  public track(guestId: string, category: string, action: string, metadata?: Record<string, any>) {
    console.log(`[GrowthAnalytics] Tracked:`, { guestId, category, action, metadata });
    // Aquí puedes enlazar la lógica real de eventos
  }
}

export class GuestProfileManager {
  public static getOrCreateProfile() {
    // Si tienes lógica almacenada localmente o en cookies, la retornas aquí
    return {
      guest_id: 'guest_demo_123',
      matches_played: 0,
      wins: 0,
      losses: 0,
    };
  }

  public static updateProfile(data: Partial<{ matches_played: number; wins: number; losses: number }>) {
    console.log(`[GuestProfileManager] Profile updated:`, data);
  }
}

// ────────── Nuevas Exportaciones para el Sprint MF-3 ──────────
export * from './feature-flags';
export * from './founder-badge';
export * from './seo';
export * from './share';
export * from './types/user';