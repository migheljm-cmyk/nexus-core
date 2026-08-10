// apps/main-app/scripts/test-layer1.ts

import dns from 'node:dns/promises';
import {
  Layer1TechnicalResult,
  Layer2ReputationResult,
  DnsRecords,
  WhoisData,
  IpProfile,
} from '../src/lib/osint/types';
import { resolveSslCertificate } from '../src/lib/osint/layer2/tlsResolver';
import { resolveSerperDorks } from '../src/lib/osint/layer2/serperResolver';
import { evaluateAllFlags, calculateRiskFromFlags } from '../src/lib/osint/evaluators/flagEngine';

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

    const spfRecord = flatTxt.find((t) => t.startsWith('v=spf1'));
    if (spfRecord) {
      records.spf = spfRecord;
      records.hasSpf = true;
    }

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

    const response = await fetch(url);
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
 * Función principal de prueba del pipeline (Capas 1, 2 y 3)
 */
async function runTest() {
  const targetDomain = process.argv[2] || 'google.com';
  const companyName = process.argv[3] || targetDomain.split('.')[0];
  const cleanDomain = targetDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  console.log(`\n==================================================`);
  console.log(`🔎 INICIANDO PRUEBA CAPAS 1, 2 Y 3: [ ${cleanDomain} ]`);
  console.log(`==================================================\n`);

  const startTime = Date.now();

  // Ejecución en paralelo de Capa 1 y Capa 2
  const [dnsRes, whoisRes, ipRes, sslRes, serperRes] = await Promise.allSettled([
    resolveDns(cleanDomain),
    resolveWhois(cleanDomain),
    resolveIpProfile(cleanDomain),
    resolveSslCertificate(cleanDomain),
    resolveSerperDorks(companyName),
  ]);

  const elapsedTime = Date.now() - startTime;

  const layer1Result: Layer1TechnicalResult = {
    domain: cleanDomain,
    timestamp: new Date().toISOString(),
    dns: dnsRes.status === 'fulfilled' ? dnsRes.value : { mx: [], spf: null, dmarc: null, txt: [], hasSpf: false, hasDmarc: false },
    whois: whoisRes.status === 'fulfilled' ? whoisRes.value : { registrarName: null, createdDate: null, expiresDate: null, domainAgeDays: null, raw: {} },
    ip: ipRes.status === 'fulfilled' ? ipRes.value : null,
    errors: [],
  };

  const layer2Result: Layer2ReputationResult = {
    ssl: sslRes.status === 'fulfilled' ? sslRes.value : { issuer: null, validFrom: null, validTo: null, daysRemaining: null, isValid: false, selfSigned: false },
    serperDorks: serperRes.status === 'fulfilled' ? serperRes.value : null,
  };

  // EVALUACIÓN UNIFICADA DE BANDERAS ROJAS (CAPA 3)
  const flags = evaluateAllFlags(layer1Result, layer2Result);
  const risk = calculateRiskFromFlags(flags);

  console.log(`⏱️  Tiempo de respuesta total: ${elapsedTime} ms\n`);
  
  console.log('📋 RESULTADO CAPA 1 (TÉCNICA):');
  console.log(JSON.stringify(layer1Result, null, 2));

  console.log('\n🔒 RESULTADO CAPA 2 (REPUTACIÓN Y SSL):');
  console.log(JSON.stringify(layer2Result, null, 2));

  console.log(`\n==================================================`);
  console.log(`🚨 EVALUACIÓN DE RIESGO UNIFICADA (CAPA 3)`);
  console.log(`==================================================`);
  console.log(`Score de Riesgo : ${risk.score}/100`);
  console.log(`Nivel de Riesgo : ${risk.level}`);
  console.log(`Banderas Red    : ${flags.length}`);
  console.log(`--------------------------------------------------`);
  console.log(JSON.stringify(flags, null, 2));
  console.log(`\n==================================================\n`);
}

runTest();