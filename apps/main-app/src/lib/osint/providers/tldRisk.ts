import { Resolver } from 'dns/promises';

export interface DomainRiskResult {
  domain: string;
  riskScore: number; // 0 (Bajo) a 100 (Crítico)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
  details: {
    tld: string;
    tldRiskCategory: 'HIGH_RISK' | 'MODERATE' | 'STANDARD';
    domainAgeDays: number | null;
    registrationDate: string | null;
    dnsRecords: {
      hasSpf: boolean;
      spfRaw?: string;
      hasDmarc: boolean;
      dmarcRaw?: string;
    };
  };
}

// TLDs frecuentemente asociados con actividades de phishing, spam o empresas fantasma
const HIGH_RISK_TLDS = new Set([
  'top', 'xyz', 'cc', 'gg', 'work', 'click', 'gq', 'cf', 'tk', 'ml', 'ga', 'site', 'online', 'vip'
]);

const MODERATE_RISK_TLDS = new Set([
  'info', 'biz', 'icu', 'cam', 'rest'
]);

/**
 * Consulta la API pública de RDAP para obtener la fecha de creación del dominio.
 */
async function getDomainRegistrationDate(domain: string): Promise<string | null> {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 } // Cache por 24 hrs
    });

    if (!response.ok) return null;

    const data = await response.json();
    const events: Array<{ eventAction: string; eventDate: string }> = data.events || [];

    const registrationEvent = events.find(
      (e) => e.eventAction === 'registration' || e.eventAction === 'created'
    );

    return registrationEvent ? registrationEvent.eventDate : null;
  } catch (error) {
    return null;
  }
}

/**
 * Evalúa los registros TXT en DNS para identificar políticas SPF y DMARC.
 */
async function analyzeDnsSecurity(domain: string) {
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']); // Google & Cloudflare DNS

  let hasSpf = false;
  let spfRaw: string | undefined;
  let hasDmarc = false;
  let dmarcRaw: string | undefined;

  try {
    // Consulta SPF en la raíz del dominio
    const txtRecords = await resolver.resolveTxt(domain);
    const flatTxt = txtRecords.map((r) => r.join(''));
    
    const spfRecord = flatTxt.find((r) => r.startsWith('v=spf1'));
    if (spfRecord) {
      hasSpf = true;
      spfRaw = spfRecord;
    }
  } catch (e) {
    // Falla de resolución TXT tratada como ausencia de SPF
  }

  try {
    // Consulta DMARC en _dmarc.domain
    const dmarcRecords = await resolver.resolveTxt(`_dmarc.${domain}`);
    const flatDmarc = dmarcRecords.map((r) => r.join(''));
    
    const dmarcRecord = flatDmarc.find((r) => r.startsWith('v=DMARC1'));
    if (dmarcRecord) {
      hasDmarc = true;
      dmarcRaw = dmarcRecord;
    }
  } catch (e) {
    // Falla de resolución TXT tratada como ausencia de DMARC
  }

  return { hasSpf, spfRaw, hasDmarc, dmarcRaw };
}

/**
 * Función principal para analizar el riesgo integral de un dominio B2B.
 */
export async function analyzeDomainRisk(domainInput: string): Promise<DomainRiskResult> {
  // Limpieza básica del input (remover protocolos o paths si existen)
  const cleanDomain = domainInput
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .split('/')[0]
    .toLowerCase();

  const domainParts = cleanDomain.split('.');
  const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : '';

  let riskScore = 0;
  const flags: string[] = [];

  // 1. Evaluación por TLD
  let tldRiskCategory: 'HIGH_RISK' | 'MODERATE' | 'STANDARD' = 'STANDARD';
  if (HIGH_RISK_TLDS.has(tld)) {
    tldRiskCategory = 'HIGH_RISK';
    riskScore += 30;
    flags.push(`TLD de alto riesgo detectado (.${tld})`);
  } else if (MODERATE_RISK_TLDS.has(tld)) {
    tldRiskCategory = 'MODERATE';
    riskScore += 15;
    flags.push(`TLD con riesgo moderado (.${tld})`);
  }

  // 2. Consulta RDAP y Evaluación de Antigüedad
  const regDateStr = await getDomainRegistrationDate(cleanDomain);
  let domainAgeDays: number | null = null;

  if (regDateStr) {
    const regDate = new Date(regDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - regDate.getTime());
    domainAgeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (domainAgeDays < 30) {
      riskScore += 45;
      flags.push(`Dominio extremadamente reciente (${domainAgeDays} días de antigüedad)`);
    } else if (domainAgeDays < 90) {
      riskScore += 30;
      flags.push(`Dominio reciente (< 90 días de antigüedad: ${domainAgeDays} días)`);
    } else if (domainAgeDays < 180) {
      riskScore += 15;
      flags.push(`Dominio menor a 6 meses de antigüedad (${domainAgeDays} días)`);
    }
  } else {
    riskScore += 10;
    flags.push('No se pudo verificar la fecha de registro en RDAP/Whois');
  }

  // 3. Evaluación de Seguridad DNS (SPF / DMARC)
  const dnsSecurity = await analyzeDnsSecurity(cleanDomain);

  if (!dnsSecurity.hasSpf) {
    riskScore += 15;
    flags.push('Falta registro SPF en DNS (Riesgo de suplantación/Spoofing)');
  }

  if (!dnsSecurity.hasDmarc) {
    riskScore += 10;
    flags.push('Falta política DMARC en DNS');
  }

  // Cap de score máximo en 100
  riskScore = Math.min(riskScore, 100);

  // Determinar nivel de riesgo cualitativo
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (riskScore >= 70) riskLevel = 'CRITICAL';
  else if (riskScore >= 45) riskLevel = 'HIGH';
  else if (riskScore >= 20) riskLevel = 'MEDIUM';

  return {
    domain: cleanDomain,
    riskScore,
    riskLevel,
    flags,
    details: {
      tld,
      tldRiskCategory,
      domainAgeDays,
      registrationDate: regDateStr,
      dnsRecords: dnsSecurity
    }
  };
}