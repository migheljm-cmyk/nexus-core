import { Resolver } from 'dns/promises';

export interface SanctionMatch {
  id: string;
  caption: string;
  schema: string;
  countries: string[];
  sanctionsList: string[];
  score: number; // Porcentaje de coincidencia (0.0 a 1.0)
}

export interface GeoIpMatch {
  ip: string;
  hostingCountry: string;
  declaredCountry: string;
  isMismatch: boolean;
  isp?: string;
}

export interface OpenSanctionsResult {
  targetName: string;
  hasSanctionsMatch: boolean;
  sanctionMatches: SanctionMatch[];
  geoIpAnalysis?: GeoIpMatch;
  riskScorePenalty: number;
  flags: string[];
}

/**
 * Consulta la API de OpenSanctions para verificar personas físicas o morales contra listas de sanciones globales.
 */
async function searchGlobalSanctions(queryName: string): Promise<SanctionMatch[]> {
  try {
    const encodedQuery = encodeURIComponent(queryName);
    const response = await fetch(`https://api.opensanctions.org/match/default?q=${encodedQuery}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // Si cuentas con un token en .env, se incluye en Authorization
        ...(process.env.OPENSANCTIONS_API_KEY && {
          'Authorization': `ApiKey ${process.env.OPENSANCTIONS_API_KEY}`
        })
      },
      next: { revalidate: 86400 } // Cache diario
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results = data.results || [];

    // Filtrar coincidencias con un nivel relevante de confianza (score >= 0.70)
    return results
      .filter((item: any) => item.score >= 0.70)
      .map((item: any) => ({
        id: item.id,
        caption: item.caption,
        schema: item.schema,
        countries: item.properties?.country || [],
        sanctionsList: item.properties?.topics || ['sanction'],
        score: item.score
      }));
  } catch (error) {
    return [];
  }
}

/**
 * Resuelve la IP del dominio y realiza una validación de geolocalización contra el país declarado.
 */
async function analyzeGeoIpMismatch(domain: string, declaredCountryCode: string): Promise<GeoIpMatch | null> {
  try {
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);

    // 1. Obtener la IP A del dominio
    const addresses = await resolver.resolve4(domain);
    if (!addresses || addresses.length === 0) return null;

    const targetIp = addresses[0];

    // 2. Consulta de geolocalización vía IP-API (Endpoint público sin SSL para free tier)
    const geoResponse = await fetch(`http://ip-api.com/json/${targetIp}?fields=status,countryCode,isp`, {
      next: { revalidate: 86400 }
    });

    if (!geoResponse.ok) return null;

    const geoData = await geoResponse.json();
    if (geoData.status !== 'success') return null;

    const hostingCountry = geoData.countryCode.toUpperCase();
    const declaredCountry = declaredCountryCode.toUpperCase();

    // Detección de discrepancia de país (ej. Empresa declarada en México, servidor en Tailandia o Seychelles)
    const isMismatch = hostingCountry !== declaredCountry;

    return {
      ip: targetIp,
      hostingCountry,
      declaredCountry,
      isMismatch,
      isp: geoData.isp
    };
  } catch (error) {
    return null;
  }
}

/**
 * Función principal para la evaluación de sanciones internacionales y geolocalización.
 */
export async function analyzeGlobalSanctionsAndGeo(
  entityName: string,
  domain?: string,
  declaredCountryCode: string = 'MX'
): Promise<OpenSanctionsResult> {
  const flags: string[] = [];
  let riskScorePenalty = 0;

  // 1. Búsqueda en listas de sanciones (OFAC, ONU, UE, etc.)
  const matches = await searchGlobalSanctions(entityName);
  const hasSanctionsMatch = matches.length > 0;

  if (hasSanctionsMatch) {
    riskScorePenalty += 100; // Penalización crítica inmediata
    flags.push(`CRÍTICO: Coincidencia detectada en listas de sanciones internacionales (${matches.length} alerta/s)`);
  }

  // 2. Búsqueda y análisis GeoIP si se cuenta con un dominio
  let geoIpResult: GeoIpMatch | undefined;

  if (domain) {
    const cleanDomain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    const geoAnalysis = await analyzeGeoIpMismatch(cleanDomain, declaredCountryCode);

    if (geoAnalysis) {
      geoIpResult = geoAnalysis;
      if (geoAnalysis.isMismatch) {
        riskScorePenalty += 20;
        flags.push(
          `Discrepancia geográfica: Infraestructura alojada en [${geoAnalysis.hostingCountry}] vs. País declarado [${geoAnalysis.declaredCountry}]`
        );
      }
    }
  }

  return {
    targetName: entityName,
    hasSanctionsMatch,
    sanctionMatches: matches,
    geoIpAnalysis: geoIpResult,
    riskScorePenalty: Math.min(riskScorePenalty, 100),
    flags
  };
}