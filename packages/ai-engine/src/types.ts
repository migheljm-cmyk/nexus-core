import { AIProviderType } from '@nexus/config';

export interface AIRequestOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: AIProviderType; // Opcional: sobreescribe el proveedor por defecto
}

export interface AIResponse {
  text: string;
  providerUsed: AIProviderType;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  executionTimeMs: number;
}

export interface AIProviderAdapter {
  name: AIProviderType;
  generateText(options: AIRequestOptions): Promise<AIResponse>;
}