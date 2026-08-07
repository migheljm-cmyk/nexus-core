import { defineAppConfig } from '@nexus/config';

export const mindforgeConfig = defineAppConfig({
  id: 'app-mindforge',
  name: 'MindForge Entertainment',
  domain: 'mindforge.nexus.internal',
  logoUrl: '/logo.svg',
  branding: {
    name: 'MindForge Entertainment',
    tagline: 'Plataforma de entretenimiento y juegos de NEXUS CORE',
    logoUrl: '/logo.svg',
    faviconUrl: '/favicon.ico',
    domain: 'mindforge.nexus.internal',
    meta: {
      title: 'MindForge Entertainment',
      description: 'Plataforma interactiva del ecosistema NEXUS CORE',
    },
  },
  theme: {
    primaryColor: '#8b5cf6',
    accentColor: '#ec4899',
    darkMode: true,
  },
  modules: {
    analytics: true,
    ai: true,
    ads: false,
    stripe: false,
  },
  ai: {
    defaultProvider: 'gemini',
    fallbackProvider: 'groq',
  },
  featureFlags: {
    chessEnabled: true,
    sudokuEnabled: true,
    pegEnabled: true,
    adsEnabled: false,
    aiEnabled: true,
    premiumEnabled: false,
  },
  ads: {
    provider: 'none',
    slots: {},
  },
  features: {},
});