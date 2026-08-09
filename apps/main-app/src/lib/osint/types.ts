import { DomainRiskResult } from './providers/tldRisk';
import { SatCheckResult } from './providers/satCheck';
import { OpenSanctionsResult } from './providers/openSanctions';

export type OsintRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface OsintTargetInput {
  companyName: string;
  domain?: string;
  rfc?: string;
  mercantileFolio?: string;
  declaredCountryCode?: string; // Código de 2 letras (ej. 'MX', 'US')
}

export interface OsintReportSummary {
  overallRiskScore: number; // Score consolidado de 0 a 100
  overallRiskLevel: OsintRiskLevel;
  totalFlagsCount: number;
  criticalAlerts: string[];
  allFlags: string[];
}

export interface OsintAuditTrail {
  payloadHash: string; // Hash SHA-256 para inmutabilidad del reporte
  timestamp: string;
  apiVersion: string;
  environment: string;
}

export interface OsintAnalysisReport {
  target: OsintTargetInput;
  summary: OsintReportSummary;
  modules: {
    domainRisk?: DomainRiskResult;
    satCheck?: SatCheckResult;
    openSanctions?: OpenSanctionsResult;
  };
  auditTrail: OsintAuditTrail;
}