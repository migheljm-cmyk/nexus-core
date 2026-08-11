// apps/main-app/src/lib/osint/forensics.ts

export interface CryptographicSealResult {
  record_id: string;
  sha256_hash: string;
  timestamp: string;
  is_valid: boolean;
}

export type InvestigationVector = 
  | 'VECTOR_1_CORPORATE'
  | 'VECTOR_2_GEOSPATIAL'
  | 'VECTOR_3_DIGITAL_INFRA'
  | 'VECTOR_4_TELECOM_MSG';

export interface ExtractedEntity {
  vector: InvestigationVector;
  type: string;
  rawValue: string;
  normalizedValue: string;
  metadata: Record<string, any>;
  riskPoints: number;
}