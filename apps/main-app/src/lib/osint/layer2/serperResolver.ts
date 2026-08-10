// apps/main-app/src/lib/osint/layer2/serperResolver.ts

import { SerperDorkResult } from '../types';

/**
 * Ejecuta dorks de reputación y búsqueda de alertas en Google vía Serper.dev API
 */
export async function resolveSerperDorks(companyName: string): Promise<SerperDorkResult | null> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey || !companyName) {
    return null; // Si no hay API key configurada, omite la consulta sin romper el pipeline
  }

  try {
    const dorkQuery = `"${companyName}" (fraude OR estafa OR demanda OR denuncia OR reclamo)`;

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: dorkQuery,
        num: 5, // Top 5 resultados
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const organic = data.organic || [];

    const suspiciousSnippets = organic.map((item: any) => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
    }));

    return {
      queryUsed: dorkQuery,
      totalResults: organic.length,
      suspiciousSnippets,
      hasFraudAlerts: organic.length > 0,
    };
  } catch {
    return null;
  }
}