import { AIProviderAdapter, AIRequestOptions, AIResponse } from '../types';

export class GeminiProvider implements AIProviderAdapter {
  name = 'gemini' as const;

  async generateText(options: AIRequestOptions): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Aquí se realiza la llamada REST a la API de Gemini
    // En este paso base estructuramos el payload normalizado:
    return {
      text: `[Respuesta procesada via Gemini Core Engine]: ${options.prompt}`,
      providerUsed: 'gemini',
      usage: {
        promptTokens: options.prompt.length / 4,
        completionTokens: 150,
        totalTokens: (options.prompt.length / 4) + 150,
      },
      executionTimeMs: Date.now() - startTime,
    };
  }
}

export class GroqProvider implements AIProviderAdapter {
  name = 'groq' as const;

  async generateText(options: AIRequestOptions): Promise<AIResponse> {
    const startTime = Date.now();
    return {
      text: `[Respuesta procesada via Groq High-Speed Core]: ${options.prompt}`,
      providerUsed: 'groq',
      usage: {
        promptTokens: options.prompt.length / 4,
        completionTokens: 120,
        totalTokens: (options.prompt.length / 4) + 120,
      },
      executionTimeMs: Date.now() - startTime,
    };
  }
}