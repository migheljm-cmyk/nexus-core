export interface RdapResult {
  domain: string;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  nameServers?: string[];
  isRecentlyCreated: boolean; // Si tiene menos de 90 días de antigüedad (indicador de riesgo)
}

export interface EmailReputationResult {
  email: string;
  domain: string;
  isDisposable: boolean;
  isFreeProvider: boolean;
  isHighRiskDomain: boolean; // Ej. dominios de spam o patrones sospechosos
  riskContribution: number;
}

// Dominios de correos temporales / desechables comunes
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
]);

// Proveedores gratuitos comunes
const FREE_EMAIL_PROVIDERS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
]);

// Dominios que requieren mayor monitoreo en contextos transfronterizos
const HIGH_RISK_PATTERNS = ['qq.com', '163.com', '126.com', 'sina.com'];

/**
 * Consulta RDAP oficial via IANA/RDAP Bootstrap para dominios
 */
export async function lookupRdapDomain(domain: string): Promise<RdapResult> {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

  try {
    // Consulta a la API abierta de RDAP (rdap.org)
    const response = await fetch(`https://rdap.org/domain/${cleanDomain}`, {
      headers: { Accept: 'application/rdap+json' },
      next: { revalidate: 86400 }, // Cache por 24 horas
    });

    if (!response.ok) {
      return {
        domain: cleanDomain,
        isRecentlyCreated: false,
      };
    }

    const data = await response.json();

    // Extracción de fechas de eventos
    let creationDate: string | undefined;
    let expirationDate: string | undefined;

    if (Array.isArray(data.events)) {
      for (const event of data.events) {
        if (event.eventAction === 'registration') {
          creationDate = event.eventDate;
        }
        if (event.eventAction === 'expiration') {
          expirationDate = event.eventDate;
        }
      }
    }

    // Extracción de Name Servers
    const nameServers: string[] = [];
    if (Array.isArray(data.nameservers)) {
      data.nameservers.forEach((ns: any) => {
        if (ns.ldhName) nameServers.push(ns.ldhName.toLowerCase());
      });
    }

    // Extracción del Registrador
    let registrar: string | undefined;
    if (Array.isArray(data.entities)) {
      const registrarEntity = data.entities.find((e: any) =>
        Array.isArray(e.roles) && e.roles.includes('registrar')
      );
      if (registrarEntity && registrarEntity.vcardArray) {
        const fnEntry = registrarEntity.vcardArray[1]?.find((item: any) => item[0] === 'fn');
        if (fnEntry) registrar = fnEntry[3];
      }
    }

    // Evaluar si fue creado en los últimos 90 días
    let isRecentlyCreated = false;
    if (creationDate) {
      const createdTime = new Date(creationDate).getTime();
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      isRecentlyCreated = createdTime > ninetyDaysAgo;
    }

    return {
      domain: cleanDomain,
      registrar,
      creationDate,
      expirationDate,
      nameServers,
      isRecentlyCreated,
    };
  } catch (error) {
    console.error('[RDAP Lookup Error]:', error);
    return {
      domain: cleanDomain,
      isRecentlyCreated: false,
    };
  }
}

/**
 * Evaluación de Reputación y Riesgo para Correos Electrónicos
 */
export function analyzeEmailReputation(email: string): EmailReputationResult {
  const cleanEmail = email.trim().toLowerCase();
  const domain = cleanEmail.split('@')[1] || '';

  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);
  const isFreeProvider = FREE_EMAIL_PROVIDERS.has(domain);
  const isHighRiskDomain = HIGH_RISK_PATTERNS.includes(domain);

  let riskContribution = 0;

  if (isDisposable) {
    riskContribution = 85; // Riesgo Alto por correo desechable
  } else if (isHighRiskDomain) {
    riskContribution = 40; // Riesgo Medio para requerir verificación adicional
  } else if (isFreeProvider) {
    riskContribution = 15; // Riesgo Bajo / Informativo
  }

  return {
    email: cleanEmail,
    domain,
    isDisposable,
    isFreeProvider,
    isHighRiskDomain,
    riskContribution,
  };
}