// apps/main-app/src/lib/osint/types.ts

import { DomainRiskResult } from './providers/tldRisk';
import { SatCheckResult } from './providers/satCheck';
import { OpenSanctionsResult } from './providers/openSanctions';

// ==========================================
// 1. NIVELES DE RIESGO Y ENTRADA DE USUARIO
// ==========================================

export type OsintRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface OsintTargetInput {
  companyName: string;
  domain?: string;
  rfc?: string;
  mercantileFolio?: string;
  declaredCountryCode?: string; // Código de 2 letras (ej. 'MX', 'US', 'CN')
}

// ==========================================
// 2. CAPA 1: RECOLECCIÓN TÉCNICA Y DOMINIO
// ==========================================

/**
 * Registros DNS técnicos (node:dns)
 */
export interface DnsRecords {
  mx: string[];
  spf: string | null;
  dmarc: string | null;
  txt: string[];
  hasSpf: boolean;
  hasDmarc: boolean;
}

/**
 * Información del registrador y antigüedad (WHOIS / RDAP)
 */
export interface WhoisData {
  registrarName: string | null;
  createdDate: string | null;
  expiresDate: string | null;
  domainAgeDays: number | null;
  raw: Record<string, unknown>;
}

/**
 * Infraestructura de servidor y geolocalización IP (IPinfo)
 */
export interface IpProfile {
  ip: string;
  hostname: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  org: string | null; // Proveedor de Hosting / ISP
  isHostingOrBogon: boolean;
}

/**
 * Resultado unificado de la Capa 1
 */
export interface Layer1TechnicalResult {
  domain: string;
  timestamp: string;
  dns: DnsRecords;
  whois: WhoisData;
  ip: IpProfile | null;
  errors: string[];
}

// ==========================================
// 3. CAPA 2: IDENTIDAD DIGITAL Y REPUTACIÓN
// ==========================================

/**
 * Inspección de certificado SSL/TLS (node:tls)
 */
export interface SslCertData {
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  isValid: boolean;
  selfSigned: boolean;
}

/**
 * Búsqueda automatizada de Dorks de Fraude / Litigios (Serper API)
 */
export interface SerperDorkResult {
  queryUsed: string;
  totalResults: number;
  suspiciousSnippets: { title: string; link: string; snippet: string }[];
  hasFraudAlerts: boolean;
}

/**
 * Validación sintáctica y de existencia de Email (Hunter.io / Verifalia)
 */
export interface EmailValidationData {
  email: string;
  isValidFormat: boolean;
  isDisposable: boolean;
  hasMxRecords: boolean;
}

/**
 * Resultado unificado de la Capa 2
 */
export interface Layer2ReputationResult {
  ssl: SslCertData;
  serperDorks?: SerperDorkResult | null;
  emailValidation?: EmailValidationData | null;
}

// ==========================================
// 4. CAPA 3: MATRIZ DE BANDERAS ROJAS (RED FLAGS)
// ==========================================

export interface OsintFlag {
  id: string;
  code: string;
  severity: OsintRiskLevel;
  title: string;
  description: string;
  evidence: string; // Hecho duro que detonó la alerta
}

// ==========================================
// 5. ESTRUCTURA CONSOLIDADA DEL REPORTE FINAL
// ==========================================

export interface OsintReportSummary {
  overallRiskScore: number; // Score de 0 a 100 (0: Limpio, 100: Riesgo Crítico)
  overallRiskLevel: OsintRiskLevel;
  totalFlagsCount: number;
  criticalAlerts: string[];
  allFlags: OsintFlag[];
}

export interface OsintAuditTrail {
  payloadHash: string; // Hash SHA-256 para inmutabilidad del reporte
  timestamp: string;
  apiVersion: string;
  environment: string;
}

/**
 * Reporte Final OSINT B2B que unifica las 4 Capas de Análisis
 */
export interface OsintAnalysisReport {
  target: OsintTargetInput;
  summary: OsintReportSummary;
  layer1Technical?: Layer1TechnicalResult;
  layer2Reputation?: Layer2ReputationResult;
  modules: {
    domainRisk?: DomainRiskResult;
    satCheck?: SatCheckResult;
    openSanctions?: OpenSanctionsResult;
  };
  auditTrail: OsintAuditTrail;
}