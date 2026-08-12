// apps/main-app/src/lib/osint/enrichment/dnsResolver.ts

import dns from 'dns/promises';

export interface DnsRecordResult {
  domain: string;
  aRecords: string[];
  mxRecords: { exchange: string; priority: number }[];
  txtRecords: string[];
  nsRecords: string[];
  hasSpf: boolean;
  hasDmarc: boolean;
  error?: string;
}

/**
 * Consulta pasiva de registros DNS para un dominio objetivo.
 */
export async function resolveDomainInfrastructure(domain: string): Promise<DnsRecordResult> {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

  const result: DnsRecordResult = {
    domain: cleanDomain,
    aRecords: [],
    mxRecords: [],
    txtRecords: [],
    nsRecords: [],
    hasSpf: false,
    hasDmarc: false,
  };

  try {
    // 1. Registros IPv4 (A)
    try {
      result.aRecords = await dns.resolve4(cleanDomain);
    } catch {
      result.aRecords = [];
    }

    // 2. Registros de Correo (MX)
    try {
      const mx = await dns.resolveMx(cleanDomain);
      result.mxRecords = mx.map((r) => ({ exchange: r.exchange, priority: r.priority }));
    } catch {
      result.mxRecords = [];
    }

    // 3. Registros de Texto (TXT) - SPF y Verificaciones
    try {
      const txt = await dns.resolveTxt(cleanDomain);
      const flatTxt = txt.map((t) => t.join(' '));
      result.txtRecords = flatTxt;
      result.hasSpf = flatTxt.some((t) => t.toLowerCase().includes('v=spf1'));
    } catch {
      result.txtRecords = [];
    }

    // 4. Verificación DMARC (_dmarc.domain)
    try {
      const dmarcTxt = await dns.resolveTxt(`_dmarc.${cleanDomain}`);
      const flatDmarc = dmarcTxt.map((t) => t.join(' '));
      result.hasDmarc = flatDmarc.some((t) => t.toLowerCase().includes('v=dmarc1'));
    } catch {
      result.hasDmarc = false;
    }

    // 5. Servidores de Nombres (NS)
    try {
      result.nsRecords = await dns.resolveNs(cleanDomain);
    } catch {
      result.nsRecords = [];
    }

    return result;
  } catch (err: any) {
    result.error = err.message || 'Error resolviendo registros DNS';
    return result;
  }
}