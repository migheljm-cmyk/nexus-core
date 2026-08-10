// apps/main-app/src/lib/osint/layer4/layer4Synthesizer.ts

import { Layer1TechnicalResult, Layer2ReputationResult, OsintFlag, OsintRiskLevel } from '../types';

export interface Layer4SynthesisOutput {
  executiveSummary: string;
  verdict: string;
  recommendedActions: string[];
  keyRiskDrivers: string[];
}

/**
 * Genera el Prompt estructurado que se enviará al LLM
 */
export function buildLayer4Prompt(
  targetName: string,
  layer1: Layer1TechnicalResult,
  layer2: Layer2ReputationResult | undefined,
  flags: OsintFlag[],
  score: number,
  level: OsintRiskLevel
): string {
  const jsonContext = JSON.stringify(
    {
      target: targetName,
      riskAssessment: { score, level, totalFlags: flags.length },
      redFlags: flags,
      technicalInfrastructure: layer1,
      reputationAndSsl: layer2,
    },
    null,
    2
  );

  return `
Usted es un Senior OSINT & Fraud Risk Intelligence Analyst especializado en Due Diligence B2B e investigación de contrapartes comerciales.

SU TAREA:
Analizar la siguiente evidencia técnica y reputacional recolectada en tiempo real sobre la entidad "${targetName}" y redactar una Síntesis Ejecutiva de Inteligencia en español.

REGLAS STRICTAS:
1. Basarse EXCLUSIVAMENTE en los hechos duros proporcionados en el JSON adjunto. NO invente ni asuma datos que no estén respaldados por la evidencia.
2. Si el Score de Riesgo es bajo y no hay Banderas Rojas, confirme la integridad técnica sin alarmismos innecesarios.
3. Si existen Banderas Rojas (especialmente de nivel CRITICAL o HIGH), explique con claridad comercial la implicación de riesgo (ej. riesgo de suplantación, falta de trazabilidad, empresa de reciente creación).
4. Su respuesta debe ser clara, profesional y lista para presentarse a un Comité de Riesgo o Dirección General.

EVIDENCIA RECOLECTADA (JSON CONTEXT):
\`\`\`json
${jsonContext}
\`\`\`

RESPONDA ÚNICAMENTE EN EL SIGUIENTE FORMATO JSON (Sin bloques de texto adicionales):
{
  "executiveSummary": "Resumen narrativo de 2 a 3 párrafos analizando la postura de la contraparte...",
  "verdict": "Veredicto claro (ej. PROCEDER CON PRECAUCIÓN / APROBADO / RECHAZAR O SOLICITAR GARANTÍAS ADICIONALES)",
  "recommendedActions": [
    "Acción concreta 1...",
    "Acción concreta 2..."
  ],
  "keyRiskDrivers": [
    "Factor principal de riesgo 1...",
    "Factor principal de riesgo 2..."
  ]
}
`;
}