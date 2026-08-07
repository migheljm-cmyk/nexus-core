// Declaración segura para acceder a variables de entorno de Node en paquetes del monorepo
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'groq';

export interface AppBranding {
  name: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  domain: string;
  meta: {
    title: string;
    description: string;
  };
  socialLinks?: Record<string, string>;
}

export interface FeatureFlags {
  chessEnabled: boolean;
  sudokuEnabled: boolean;
  pegEnabled: boolean;
  adsEnabled: boolean;
  aiEnabled: boolean;
  premiumEnabled: boolean;
  [key: string]: boolean; // Permite flags dinámicos adicionales sin romper tipos
}

export interface AdsConfig {
  provider: 'google-admob' | 'custom' | 'none';
  clientKey?: string;
  slots: {
    bannerId?: string;
    interstitialId?: string;
    rewardedId?: string;
  };
}

export interface AppConfig {
  id: string;
  name: string;
  domain: string;
  logoUrl: string;
  branding: AppBranding;
  theme: {
    primaryColor: string;
    accentColor: string;
    darkMode: boolean;
  };
  modules: {
    analytics: boolean;
    ai: boolean;
    ads: boolean;
    stripe: boolean;
  };
  ai: {
    defaultProvider: AIProviderType;
    fallbackProvider?: AIProviderType;
    maxTokensPerRequest?: number;
  };
  featureFlags: FeatureFlags;
  ads: AdsConfig;
  features: Record<string, boolean>;
}

export const defineAppConfig = (config: AppConfig): AppConfig => config;

export const APP_VERSION = "0.9.0-rc1";

export const BRAND_CONFIG = {
  name: "MindForge Platform",
  company: "Blueprint Enterprise",
  environment: (typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_VERCEL_ENV) 
    ? process.env.NEXT_PUBLIC_VERCEL_ENV 
    : "staging",
} as const;