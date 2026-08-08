import { OsintEvidenceCategory, OsintRiskScore } from '@nexus/database';

export interface OsintAnalysisInput {
  companyName: string;
  taxId?: string | null;
  legalAddress?: string | null;
  website?: string | null;
  evidences: Array<{
    category: OsintEvidenceCategory; // 👈 AQUÍ
    sourceType: string;
    data: Record<string, unknown>;
    notes?: string | null;
  }>;
}

export interface OsintAnalysisOutput {
  executiveSummary: string;
  riskScore: OsintRiskScore; // 👈 AQUÍ
  matrixFindings: Array<{
    category: OsintEvidenceCategory; // 👈 AQUÍ
    finding: string;
    riskLevel: OsintRiskScore; // 👈 AQUÍ
    source: string;
    details: string;
  }>;
  recommendations: string[];
}

export const OSINT_SYSTEM_PROMPT = `
Eres un analista experto en ciberinteligencia, Due Diligence B2B y prevención de fraudes comerciales corporativos (OSINT).
Tu objetivo es analizar evidencias estructuradas y no estructuradas sobre una entidad corporativa objetivo y producir una evaluación de riesgo objetiva y accionable.

REGLAS DE EVALUACIÓN:
1. Analiza cuidadosamente la consistencia entre la identidad corporativa, la ubicación geográfica y los canales de comunicación.
2. Anomalías comunes a penalizar:
   - Identidad corporativa: Registro bajo intermediarios de alto riesgo o giros inconsistentes.
   - Geográfica: Direcciones fiscales en hoteles, coworkings compartidos sin presencia real o casilleros postales.
   - Comunicaciones: Uso exclusivo de dominios de correo gratuitos/públicos (ej. qq.com, 163.com, gmail.com) para operaciones B2B formales.
3. El formato de salida DEBE ser strictly JSON parseable conforme al schema solicitado.
`;

export function generateOsintUserPrompt(input: OsintAnalysisInput): string {
  return `
Por favor, analiza la siguiente entidad y sus evidencias recopiladas:

ENTIDAD OBJETIVO:
- Empresa: ${input.companyName}
- Tax ID / RCF: ${input.taxId || 'No proporcionado'}
- Dirección Legal: ${input.legalAddress || 'No proporcionada'}
- Sitio Web: ${input.website || 'No proporcionado'}

EVIDENCIAS RECUPERADAS (${input.evidences.length}):
${JSON.stringify(input.evidences, null, 2)}

RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON CON LA SIGUIENTE ESTRUCTURA:
{
  "executiveSummary": "Resumen ejecutivo claro y formal de 2-3 párrafos.",
  "riskScore": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "matrixFindings": [
    {
      "category": "CORPORATE_IDENTITY" | "GEOGRAPHIC" | "COMMUNICATIONS" | "FINANCIAL" | "LEGAL",
      "finding": "Título breve del hallazgo",
      "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "source": "Origen del dato",
      "details": "Explicación detallada del riesgo o hallazgo"
    }
  ],
  "recommendations": [
    "Recomendación accionable 1",
    "Recomendación accionable 2"
  ]
}
`;
}