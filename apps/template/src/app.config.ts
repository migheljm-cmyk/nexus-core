import { defineAppConfig } from '@nexus/config';

export const appConfig = defineAppConfig({
  id: 'app-template',
  name: 'Nexus Template App',
  domain: 'template.nexus.internal',
  logoUrl: '/logo.svg',
  branding: {
    name: 'Nexus Template App',
    tagline: 'Micro-frontend de prueba y plantilla base',
    logoUrl: '/logo.svg',
    faviconUrl: '/favicon.ico',
    domain: 'template.nexus.internal',
    meta: {
      title: 'Nexus Template App',
      description: 'Micro-frontend base del ecosistema NEXUS CORE',
    },
  },
  theme: {
    primaryColor: '#6366f1',
    accentColor: '#10b981',
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
    chessEnabled: false,
    sudokuEnabled: false,
    pegEnabled: false,
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