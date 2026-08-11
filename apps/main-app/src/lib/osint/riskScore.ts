// apps/main-app/src/lib/osint/riskScore.ts
import { ExtractedEntity } from './forensics';

export interface CoiScoreResult {
  score: number; // 0.00 a 100.00
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: {
    vector: string;
    points: number;
    reason: string;
  }[];
}

/**
 * Evalúa las entidades extraídas y calcula el Índice de Opacidad Corporativa (COI Score).
 */
export function calculateCoiScore(entities: ExtractedEntity[]): CoiScoreResult {
  let totalScore = 0;
  const breakdown: CoiScoreResult['breakdown'] = [];

  for (const entity of entities) {
    if (entity.riskPoints > 0) {
      totalScore += entity.riskPoints;

      let reason = `Riesgo detectado en ${entity.type}`;
      if (entity.metadata?.is_freemail) {
        reason = `Uso de correo gratuito/masivo (${entity.metadata.domain}) para operaciones corporativas`;
      } else if (entity.metadata?.carrier_type === 'VOIP_VIRTUAL_MVNO') {
        reason = `Línea telefónica asignada a rango VoIP / Operador Virtual (MVNO)`;
      } else if (entity.metadata?.poi_category === 'HOTEL_ANNEX_OFFICE') {
        reason = `Ubicación comercial declarada en instalaciones de cadena hotelera`;
      }

      breakdown.push({
        vector: entity.vector,
        points: entity.riskPoints,
        reason,
      });
    }
  }

  // Normalización del score con tope en 100
  const normalizedScore = Math.min(Math.round(totalScore * 100) / 100, 100);

  // Clasificación por rangos de riesgo
  let riskLevel: CoiScoreResult['riskLevel'] = 'LOW';
  if (normalizedScore >= 75) {
    riskLevel = 'CRITICAL';
  } else if (normalizedScore >= 50) {
    riskLevel = 'HIGH';
  } else if (normalizedScore >= 25) {
    riskLevel = 'MEDIUM';
  }

  return {
    score: normalizedScore,
    riskLevel,
    breakdown,
  };
}