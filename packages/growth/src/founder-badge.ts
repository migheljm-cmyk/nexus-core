export interface FounderBadgeMetadata {
  badgeId: string;
  label: string;
  grantedAt: string;
  isExclusive: boolean;
}

export const FOUNDER_2026_BADGE: FounderBadgeMetadata = {
  badgeId: 'founder_2026',
  label: 'Founder 2026',
  grantedAt: new Date().toISOString(),
  isExclusive: true,
};

/**
  * Verifica si el usuario cumple con la ventana de elegibilidad para la insignia Founder Beta.
  */
export function shouldGrantFounderBadge(userCreatedAt: string | Date): boolean {
  const cutoffDate = new Date('2026-12-31T23:59:59Z');
  const userDate = new Date(userCreatedAt);
  return userDate <= cutoffDate;
}

/**
  * Genera el payload de metadatos de usuario para Supabase / DB.
  */
export function applyFounderBadgeToProfile(userMetadata: Record<string, any>) {
  if (userMetadata.badges?.some((b: any) => b.badgeId === FOUNDER_2026_BADGE.badgeId)) {
    return userMetadata;
  }

  const existingBadges = userMetadata.badges || [];
  return {
    ...userMetadata,
    badges: [...existingBadges, FOUNDER_2026_BADGE],
  };
}