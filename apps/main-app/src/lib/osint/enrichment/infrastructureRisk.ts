// apps/main-app/src/lib/osint/enrichment/infrastructureRisk.ts

import { DnsRecordResult } from './dnsResolver';

export interface InfrastructureRiskAssessment {
  domain: string;
  additionalRiskPoints: number;
  flags: string[];
}

/**
 * Analiza la configuración DNS para determinar vectores de suplantación o infraestructura sospechosa.
 */
export function evaluateInfrastructureRisk(dnsData: DnsRecordResult): InfrastructureRiskAssessment {
  let additionalRiskPoints = 0;
  const flags: string[] = [];

  // Flag 1: Dominio sin registros A (No resuelve a un sitio web o servidor activo)
  if (dnsData.aRecords.length === 0) {
    additionalRiskPoints += 15;
    flags.push('NO_ACTIVE_A_RECORDS: El dominio no resuelve a una dirección IP activa.');
  }

  // Flag 2: Sin registros MX (Dominio que emite correos pero no tiene capacidad de recepción)
  if (dnsData.mxRecords.length === 0) {
    additionalRiskPoints += 25;
    flags.push('NO_MX_RECORDS: El dominio no tiene servidores MX configurados para correo legítimo.');
  }

  // Flag 3: Ausencia de políticas de autenticación de correo (SPF / DMARC)
  if (!dnsData.hasSpf) {
    additionalRiskPoints += 10;
    flags.push('MISSING_SPF_POLICY: Vulnerable a spoofing/suplantación por falta de registro SPF.');
  }

  if (!dnsData.hasDmarc) {
    additionalRiskPoints += 10;
    flags.push('MISSING_DMARC_POLICY: Carece de políticas DMARC de validación de identidad.');
  }

  return {
    domain: dnsData.domain,
    additionalRiskPoints,
    flags,
  };
}