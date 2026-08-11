// apps/main-app/src/lib/osint/enrichment/dnsEnrichment.ts
import { promises as dns } from 'dns';

export interface DnsEnrichmentResult {
  domain: string;
  hasMxRecords: boolean;
  mxRecords: string[];
  hasSpf: boolean;
  riskPoints: number;
  flag: 'VERIFIED_DOMAIN' | 'NO_MX_RECORDS' | 'SUSPICIOUS_INFRA';
}

/**
 * Consulta registros DNS/MX para validar la postura técnica de un dominio corporativo.
 */
export async function enrichDomainDns(domain: string): Promise<DnsEnrichmentResult> {
  try {
    const mx = await dns.resolveMx(domain).catch(() => []);
    const txt = await dns.resolveTxt(domain).catch(() => []);

    const mxRecords = mx.map((r) => r.exchange);
    const hasMxRecords = mxRecords.length > 0;

    // Búsqueda de registro SPF en registros TXT
    const txtFlattened = txt.flat();
    const hasSpf = txtFlattened.some((record) => record.includes('v=spf1'));

    let riskPoints = 0;
    let flag: DnsEnrichmentResult['flag'] = 'VERIFIED_DOMAIN';

    if (!hasMxRecords) {
      riskPoints += 35;
      flag = 'NO_MX_RECORDS';
    } else if (!hasSpf) {
      riskPoints += 15;
      flag = 'SUSPICIOUS_INFRA';
    }

    return {
      domain,
      hasMxRecords,
      mxRecords,
      hasSpf,
      riskPoints,
      flag,
    };
  } catch (error) {
    return {
      domain,
      hasMxRecords: false,
      mxRecords: [],
      hasSpf: false,
      riskPoints: 30,
      flag: 'NO_MX_RECORDS',
    };
  }
}