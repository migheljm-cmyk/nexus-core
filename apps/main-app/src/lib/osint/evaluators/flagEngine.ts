// apps/main-app/src/lib/osint/evaluators/flagEngine.ts

import {
  Layer1TechnicalResult,
  Layer2ReputationResult,
  SslCertData,
  SerperDorkResult,
  OsintFlag,
  OsintRiskLevel,
} from '../types';

/**
 * Evalúa los datos técnicos de Capa 1 y retorna las Banderas Rojas detectadas.
 */
export function evaluateLayer1Flags(layer1: Layer1TechnicalResult): OsintFlag[] {
  const flags: OsintFlag[] = [];

  // -------------------------------------------------------------
  // 1. REGLAS DE DOMINIO Y ANTIGÜEDAD (WHOIS / RDAP)
  // -------------------------------------------------------------
  const age = layer1.whois.domainAgeDays;

  if (age !== null) {
    if (age < 30) {
      flags.push({
        id: 'FLAG_DOM_VERY_NEW',
        code: 'NEW_DOMAIN_CRITICAL',
        severity: 'CRITICAL',
        title: 'Dominio de creación extremadamente reciente',
        description: 'El dominio tiene menos de 30 días de antigüedad. Este es un patrón altamente recurrente en operaciones fraudulentas y de suplantación rápida.',
        evidence: `Fecha de registro detectada: ${layer1.whois.createdDate} (${age} días de antigüedad).`,
      });
    } else if (age < 90) {
      flags.push({
        id: 'FLAG_DOM_NEW',
        code: 'NEW_DOMAIN_WARNING',
        severity: 'HIGH',
        title: 'Dominio de creación reciente',
        description: 'El dominio tiene menos de 90 días de antigüedad. Se recomienda extremar precauciones en transacciones comerciales.',
        evidence: `Antigüedad calculada: ${age} días.`,
      });
    }
  } else {
    flags.push({
      id: 'FLAG_DOM_NO_RDAP',
      code: 'WHOIS_DATA_UNAVAILABLE',
      severity: 'MEDIUM',
      title: 'Información de antigüedad no disponible',
      description: 'No se pudo obtener la fecha oficial de registro del dominio mediante RDAP/WHOIS.',
      evidence: 'Respuesta WHOIS/RDAP incompleta o bloqueada por privacidad.',
    });
  }

  // -------------------------------------------------------------
  // 2. REGLAS DE AUTENTICACIÓN Y CONFIGURACIÓN DE CORREO (DNS)
  // -------------------------------------------------------------
  if (layer1.dns.mx.length === 0) {
    flags.push({
      id: 'FLAG_DNS_NO_MX',
      code: 'NO_MX_RECORDS',
      severity: 'HIGH',
      title: 'Sin servidor de correo corporativo (Sin registros MX)',
      description: 'El dominio no tiene servidores MX configurados, lo que indica que no puede recibir correos electrónicos corporativos de forma estándar.',
      evidence: 'Consulta MX retornó un listado vacío.',
    });
  }

  if (!layer1.dns.hasSpf) {
    flags.push({
      id: 'FLAG_DNS_NO_SPF',
      code: 'MISSING_SPF',
      severity: 'MEDIUM',
      title: 'Ausencia de registro SPF',
      description: 'El dominio carece de política SPF (Sender Policy Framework), lo que facilita la suplantación de identidad por correo (email spoofing).',
      evidence: 'No se encontró registro TXT con v=spf1.',
    });
  }

  if (!layer1.dns.hasDmarc) {
    flags.push({
      id: 'FLAG_DNS_NO_DMARC',
      code: 'MISSING_DMARC',
      severity: 'MEDIUM',
      title: 'Ausencia de política DMARC',
      description: 'El dominio no implementa protección DMARC, permitiendo que terceros envíen correos no autorizados a nombre de este dominio.',
      evidence: 'Consulta TXT en _dmarc no devolvió un registro DMARC1 válido.',
    });
  }

  // -------------------------------------------------------------
  // 3. REGLAS DE INFRAESTRUCTURA DE RED E IP
  // -------------------------------------------------------------
  if (!layer1.ip) {
    flags.push({
      id: 'FLAG_IP_UNRESOLVED',
      code: 'IP_NOT_FOUND',
      severity: 'HIGH',
      title: 'Dominio sin resolución IP',
      description: 'El dominio no resuelve a una dirección IPv4 activa en los servidores DNS públicos.',
      evidence: 'dns.resolve4 no retornó direcciones válidas.',
    });
  }

  return flags;
}

/**
 * Evalúa los datos de reputación e identidad de Capa 2 (SSL / TLS).
 */
export function evaluateSslFlags(ssl: SslCertData): OsintFlag[] {
  const flags: OsintFlag[] = [];

  if (!ssl.isValid) {
    flags.push({
      id: 'FLAG_SSL_INVALID',
      code: 'SSL_INVALID_OR_EXPIRED',
      severity: 'HIGH',
      title: 'Certificado SSL/TLS Inválido o Expirado',
      description: 'El sitio web carece de un certificado cifrado válido, lo que expone las comunicaciones e indica negligencia en la infraestructura.',
      evidence: `Estado del certificado: Inválido. Días restantes: ${ssl.daysRemaining ?? 'N/A'}.`,
    });
  }

  if (ssl.selfSigned) {
    flags.push({
      id: 'FLAG_SSL_SELF_SIGNED',
      code: 'SSL_SELF_SIGNED',
      severity: 'CRITICAL',
      title: 'Certificado SSL Autofirmado (Self-Signed)',
      description: 'El certificado no fue emitido por una Autoridad Certificadora (CA) confiable. Patrón común en sitios fantasma o de phishing.',
      evidence: `Emisor detectado: ${ssl.issuer ?? 'Desconocido'}.`,
    });
  }

  return flags;
}

/**
 * Evalúa las búsquedas de reputación y Dorks de fraude de Capa 2 (Serper API).
 */
export function evaluateSerperFlags(serper: SerperDorkResult | null | undefined): OsintFlag[] {
  const flags: OsintFlag[] = [];

  if (serper && serper.hasFraudAlerts) {
    flags.push({
      id: 'FLAG_SERPER_FRAUD_MENTIONS',
      code: 'PUBLIC_FRAUD_ALERTS',
      severity: 'HIGH',
      title: 'Menciones Públicas de Fraude / Litigios Detectadas',
      description: 'Se encontraron resultados públicos en motores de búsqueda vinculando a la entidad con términos de fraude, estafas o demandas.',
      evidence: `Query ejecutada: ${serper.queryUsed}. Coincidencias encontradas: ${serper.totalResults}.`,
    });
  }

  return flags;
}

/**
 * Evaluador unificado de Capa 1 y Capa 2.
 */
export function evaluateAllFlags(
  layer1: Layer1TechnicalResult,
  layer2?: Layer2ReputationResult | null
): OsintFlag[] {
  const flagsLayer1 = evaluateLayer1Flags(layer1);
  const flagsSsl = layer2?.ssl ? evaluateSslFlags(layer2.ssl) : [];
  const flagsSerper = evaluateSerperFlags(layer2?.serperDorks);

  return [...flagsLayer1, ...flagsSsl, ...flagsSerper];
}

/**
 * Calcula un Score de Riesgo (0 a 100) y el Nivel Global basado en las banderas encontradas.
 */
export function calculateRiskFromFlags(flags: OsintFlag[]): {
  score: number;
  level: OsintRiskLevel;
} {
  let score = 0;

  for (const flag of flags) {
    switch (flag.severity) {
      case 'CRITICAL':
        score += 40;
        break;
      case 'HIGH':
        score += 25;
        break;
      case 'MEDIUM':
        score += 10;
        break;
      case 'LOW':
        score += 5;
        break;
    }
  }

  // Normalizar máximo a 100
  score = Math.min(score, 100);

  let level: OsintRiskLevel = 'LOW';
  if (score >= 70) level = 'CRITICAL';
  else if (score >= 40) level = 'HIGH';
  else if (score >= 15) level = 'MEDIUM';

  return { score, level };
}