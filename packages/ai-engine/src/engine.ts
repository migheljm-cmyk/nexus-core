import { AppConfig, AIProviderType } from '@nexus/config';
import { AIRequestOptions, AIResponse, AIProviderAdapter } from './types';
import { GeminiProvider, GroqProvider } from './providers/baseProvider';

export class NexusAIEngine {
  private providers: Map<AIProviderType, AIProviderAdapter> = new Map();
  private defaultConfig: AppConfig['ai'];

  constructor(config: AppConfig['ai']) {
    this.defaultConfig = config;
    
    // Registrar proveedores disponibles
    const gemini = new GeminiProvider();
    const groq = new GroqProvider();

    this.providers.set(gemini.name, gemini);
    this.providers.set(groq.name, groq);
  }

  async generate(options: AIRequestOptions): Promise<AIResponse> {
    const primaryProviderName = options.provider || this.defaultConfig.defaultProvider;
    const fallbackProviderName = this.defaultConfig.fallbackProvider;

    try {
      const provider = this.providers.get(primaryProviderName);
      if (!provider) throw new Error(`Proveedor ${primaryProviderName} no configurado.`);
      
      return await provider.generateText(options);
    } catch (error) {
      console.warn(`[NEXUS AI] Falló el proveedor principal (${primaryProviderName}). Ejecutando Fallback...`);
      
      if (fallbackProviderName) {
        const fallbackProvider = this.providers.get(fallbackProviderName);
        if (fallbackProvider) {
          return await fallbackProvider.generateText(options);
        }
      }
      
      throw new Error(`[NEXUS AI Error]: No se pudo procesar la solicitud con ningún proveedor.`);
    }
  }
}