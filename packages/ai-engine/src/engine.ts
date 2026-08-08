import { Logger } from '@nexus/logger';
import { NexusAnalytics } from '@nexus/analytics';
import { AIRequestOptions, AIResponse, AIProviderAdapter } from './types';
import { AIProviderType } from '@nexus/config';

export interface AIEngineConfig {
  defaultProvider: AIProviderType;
  fallbackProvider?: AIProviderType;
  appId?: string;
}

export class AIEngine {
  private providers: Map<AIProviderType, AIProviderAdapter> = new Map();
  private defaultConfig: AIEngineConfig;
  private logger: Logger;
  private analytics: NexusAnalytics;

  constructor(config: AIEngineConfig) {
    this.defaultConfig = config;
    const appId = config.appId || 'ai-engine';
    this.logger = new Logger(appId);
    this.analytics = new NexusAnalytics(appId);
  }

  registerProvider(adapter: AIProviderAdapter) {
    this.providers.set(adapter.name, adapter);
  }

  async generate(options: AIRequestOptions): Promise<AIResponse> {
    const primaryProviderName = options.provider || this.defaultConfig.defaultProvider;
    const fallbackProviderName = this.defaultConfig.fallbackProvider;

    try {
      const provider = this.providers.get(primaryProviderName);
      if (!provider) {
        throw new Error(`Proveedor ${primaryProviderName} no configurado.`);
      }

      const response = await provider.generateText(options);
      
      // Registro de telemetría automático tras éxito
      this.analytics.trackAIInteraction(
        'system',
        response.providerUsed,
        response.usage?.totalTokens || 0,
        response.executionTimeMs || 0
      );

      return response;
    } catch (error) {
      this.logger.warn(`Falló el proveedor principal (${primaryProviderName}). Ejecutando Fallback...`, {
        error: error instanceof Error ? error.message : error,
      });

      if (fallbackProviderName) {
        const fallbackProvider = this.providers.get(fallbackProviderName);
        if (fallbackProvider) {
          const response = await fallbackProvider.generateText(options);
          
          this.analytics.trackAIInteraction(
            'system',
            response.providerUsed,
            response.usage?.totalTokens || 0,
            response.executionTimeMs || 0
          );

          return response;
        }
      }

      const failureError = new Error(`[NEXUS AI Error]: No se pudo procesar la solicitud con ningún proveedor.`);
      this.logger.error('Error crítico en AI Engine', { error: failureError });
      throw failureError;
    }
  }
}