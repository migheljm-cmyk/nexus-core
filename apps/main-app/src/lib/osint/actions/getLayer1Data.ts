// apps/main-app/src/lib/osint/actions/getLayer1Data.ts
'use server';

import dns from 'node:dns/promises';
import { Layer1TechnicalResult, DnsRecords, WhoisData, IpProfile } from '../types';

/**
 * Resuelve registros DNS usando el módulo nativo node:dns
 */
async function resolveDns(domain: string): Promise<DnsRecords> {
  const records: DnsRecords = {
    mx: [],
    spf: null,
    dmarc: null,
    txt: [],
    hasSpf: false,
    hasDmarc: false,
  };

  try {
    const mxRecords = await dns.resolveMx(domain).catch(() => []);
    records.mx = mxRecords.map((r) => r.exchange);

    const txtRecords = await dns.resolveTxt(domain).catch(() => []);
    const flatTxt = txtRecords.map((t) => t.join(''));
    records.txt = flatTxt;

    // Detectar SPF
    const spfRecord = flatTxt.find((t) => t.startsWith('v=spf1'));
    if (spfRecord) {
      records.spf = spfRecord;
      records.hasSpf = true;
    }

    // Consulta específica _dmarc
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
    const flatDmarc = dmarcRecords.map((t) => t.join(''));
    const dmarcRecord = flatDmarc.find((t) => t.startsWith('v=DMARC1'));
    if (dmarcRecord) {
      records.dmarc = dmarcRecord;
      records.hasDmarc = true;
    }
  } catch (error) {
    console.error(`[DNS Error] ${domain}:`, error);
  }

  return records;
}

/**
 * Consulta antigüedad y datos de registrador vía RDAP público
 */
async function resolveWhois(domain: string): Promise<WhoisData> {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: 'application/rdap+json' },
      next: { revalidate: 86400 }, // Caché de 24 horas en Next.js
    });

    if (!response.ok) throw new Error(`RDAP HTTP ${response.status}`);
    const data = await response.json();

    const events = data.events || [];
    const registrationEvent = events.find((e: { eventAction: string }) => e.eventAction === 'registration');
    const expirationEvent = events.find((e: { eventAction: string }) => e.eventAction === 'expiration');

    const createdDate = registrationEvent?.eventDate || null;
    const expiresDate = expirationEvent?.eventDate || null;

    let domainAgeDays: number | null = null;
    if (createdDate) {
      const diffMs = Date.now() - new Date(createdDate).getTime();
      domainAgeDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    let registrarName: string | null = null;
    if (Array.isArray(data.entities)) {
      for (const entity of data.entities) {
        if (entity.roles?.includes('registrar') && entity.vcardArray?.[1]) {
          const fnField = entity.vcardArray[1].find((v: unknown[]) => Array.isArray(v) && v[0] === 'fn');
          if (fnField && fnField[3]) {
            registrarName = String(fnField[3]);
            break;
          }
        }
      }
    }

    return {
      registrarName,
      createdDate,
      expiresDate,
      domainAgeDays,
      raw: { ldhName: data.ldhName, status: data.status },
    };
  } catch (err) {
    return {
      registrarName: null,
      createdDate: null,
      expiresDate: null,
      domainAgeDays: null,
      raw: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

/**
 * Resuelve IP y proveedor de hosting vía IPinfo API
 */
async function resolveIpProfile(domain: string): Promise<IpProfile | null> {
  try {
    const addresses = await dns.resolve4(domain);
    if (!addresses.length) return null;

    const mainIp = addresses[0];
    const token = process.env.IPINFO_TOKEN;
    const url = token ? `https://ipinfo.io/${mainIp}?token=${token}` : `https://ipinfo.io/${mainIp}/json`;

    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const data = await response.json();

    return {
      ip: mainIp,
      hostname: data.hostname || null,
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
      org: data.org || null,
      isHostingOrBogon: data.org ? /AWS|Cloudflare|DigitalOcean|Hetzner|OVH|Linode|Amazon|Google|Microsoft/i.test(data.org) : false,
    };
  } catch {
    return null;
  }
}

/**
 * Server Action principal de la Capa 1
 */
export async function getLayer1Data(domain: string): Promise<Layer1TechnicalResult> {
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const errors: string[] = [];

  const [dnsRes, whoisRes, ipRes] = await Promise.allSettled([
    resolveDns(cleanDomain),
    resolveWhois(cleanDomain),
    resolveIpProfile(cleanDomain),
  ]);

  return {
    domain: cleanDomain,
    timestamp: new Date().toISOString(),
    dns: dnsRes.status === 'fulfilled' ? dnsRes.value : { mx: [], spf: null, dmarc: null, txt: [], hasSpf: false, hasDmarc: false },
    whois: whoisRes.status === 'fulfilled' ? whoisRes.value : { registrarName: null, createdDate: null, expiresDate: null, domainAgeDays: null, raw: {} },
    ip: ipRes.status === 'fulfilled' ? ipRes.value : null,
    errors,
  };
}