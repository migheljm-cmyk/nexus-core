import { 
  OSINT_SYSTEM_PROMPT, 
  generateOsintUserPrompt, 
  OsintAnalysisInput, 
  OsintAnalysisOutput 
} from '../prompts/osintPrompts';

export interface AIClient {
  generateJson<T>(params: { systemPrompt: string; userPrompt: string }): Promise<T>;
}

export class OsintEngineService {
  constructor(private readonly aiClient: AIClient) {}

  /**
   * Procesa las evidencias recolectadas y genera el informe sintético de Due Diligence OSINT.
   */
  async analyzeTarget(input: OsintAnalysisInput): Promise<OsintAnalysisOutput> {
    if (!input.evidences || input.evidences.length === 0) {
      return {
        executiveSummary: 'No se encontraron evidencias registradas para realizar una evaluación de riesgo adecuada.',
        riskScore: 'PENDING',
        matrixFindings: [],
        recommendations: ['Recolectar evidencias iniciales (identidad, ubicación, comunicaciones) antes de ejecutar el análisis.'],
      };
    }

    const userPrompt = generateOsintUserPrompt(input);

    const result = await this.aiClient.generateJson<OsintAnalysisOutput>({
      systemPrompt: OSINT_SYSTEM_PROMPT,
      userPrompt,
    });

    return {
      executiveSummary: result.executiveSummary,
      riskScore: result.riskScore ?? 'PENDING',
      matrixFindings: result.matrixFindings || [],
      recommendations: result.recommendations || [],
    };
  }
}