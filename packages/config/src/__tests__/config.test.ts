import { describe, it, expect } from 'vitest';
import { defineAppConfig, APP_VERSION, BRAND_CONFIG, AppConfig } from '../schema';

describe('Config Package Schema', () => {
  it('should export correct APP_VERSION', () => {
    expect(APP_VERSION).toBe('0.9.0-rc1');
  });

  it('should export default BRAND_CONFIG', () => {
    expect(BRAND_CONFIG.name).toBe('MindForge Platform');
    expect(BRAND_CONFIG.company).toBe('Blueprint Enterprise');
  });

  it('should validate complete AppConfig structure using defineAppConfig', () => {
    const validConfig: AppConfig = {
      id: 'mindforge-app',
      name: 'MindForge',
      domain: 'mindforge.app',
      logoUrl: 'https://mindforge.app/logo.png',
      branding: {
        name: 'MindForge Platform',
        tagline: 'Empowering Digital Workflows',
        logoUrl: 'https://mindforge.app/logo.png',
        faviconUrl: 'https://mindforge.app/favicon.ico',
        domain: 'mindforge.app',
        meta: {
          title: 'MindForge - Core',
          description: 'Engine for enterprise tools'
        }
      },
      theme: {
        primaryColor: '#0055FF',
        accentColor: '#FF5500',
        darkMode: true
      },
      modules: {
        analytics: true,
        ai: true,
        ads: false,
        stripe: true
      },
      ai: {
        defaultProvider: 'gemini',
        fallbackProvider: 'openai',
        maxTokensPerRequest: 4096
      },
      featureFlags: {
        chessEnabled: true,
        sudokuEnabled: false,
        pegEnabled: false,
        adsEnabled: false,
        aiEnabled: true,
        premiumEnabled: true
      },
      ads: {
        provider: 'none',
        slots: {}
      },
      features: {
        multiUser: true
      }
    };

    const result = defineAppConfig(validConfig);
    expect(result.id).toBe('mindforge-app');
    expect(result.theme.primaryColor).toBe('#0055FF');
  });
});