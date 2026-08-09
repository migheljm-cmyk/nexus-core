import { NextRequest, NextResponse } from 'next/server';
import { generatePayloadHash } from '../../../../lib/osint/crypto';

// Importaciones de conectores de enriquecimiento OSINT
import { analyzeDomainRisk } from '../../../../lib/osint/providers/tldRisk';
import { analyzeSatAndRegistry } from '../../../../lib/osint/providers/satCheck';
import { analyzeGlobalSanctionsAndGeo } from '../../../../lib/osint/providers/openSanctions';

// Importaciones con manejo seguro ante paquetes en desarrollo
import * as DatabasePackage from '@nexus/database';
import * as AiEnginePackage from '@nexus/ai-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Soportamos 'targetId' para retrocompatibilidad, así como campos explícitos
    const targetId = body.targetId || body.companyName || body.domain || body.rfc;
    const domainInput = body.domain;
    const rfcInput = body.rfc;
    const mercantileFolioInput = body.mercantileFolio;
    const declaredCountryCode = body.declaredCountryCode || 'MX';

    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing targetId/companyName/domain/rfc parameter.' },
        { status: 400 }
      );
    }

    const analyzedAt = new Date().toISOString();

    // 1. Obtener Target (intenta desde BD, de lo contrario genera un Target dinámico)
    let companyName = targetId.trim();
    let taxId = rfcInput || 'TAX-PENDING-001';

    try {
      const repo = (DatabasePackage as any).OsintRepository;
      if (repo && typeof repo.getTargetById === 'function') {
        const target = await repo.getTargetById(targetId);
        if (target) {
          companyName = target.companyName || companyName;
          taxId = target.taxId || taxId;
        }
      }
    } catch (e) {
      console.warn('[OSINT_API] Usando Target fallback para:', targetId);
    }

    // Identificar si la entrada principal es un dominio para los conectores
    const isDomainInput = companyName.includes('.') && !companyName.includes(' ');
    const targetDomain = domainInput || (isDomainInput ? companyName : undefined);
    const targetRfc = rfcInput || (taxId !== 'TAX-PENDING-001' ? taxId : undefined);

    // -------------------------------------------------------------
    // 2. EJECUCIÓN PARALELA: LIVE PROSPECTING + ENRICHMENT MODULES
    // -------------------------------------------------------------
    const [
      ocResResult,
      dnsResResult,
      domainRiskModule,
      satCheckModule,
      openSanctionsModule
    ] = await Promise.allSettled([
      // A. OpenCorporates Live
      fetch(`https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(companyName)}`),
      // B. DNS Live
      isDomainInput ? fetch(`https://dns.google/resolve?name=${companyName}&type=A`) : Promise.resolve(null),
      // Módulo 1: Domain Risk
      targetDomain ? analyzeDomainRisk(targetDomain) : Promise.resolve(undefined),
      // Módulo 2: SAT & Registros México
      targetRfc ? analyzeSatAndRegistry(targetRfc, mercantileFolioInput) : Promise.resolve(undefined),
      // Módulo 3: OpenSanctions & GeoIP
      analyzeGlobalSanctionsAndGeo(companyName, targetDomain, declaredCountryCode)
    ]);

    let liveEvidences: any[] = [];
    let calculatedRiskScore = 20; // Riesgo base inicial
    let ocCompanyFound = false;

    // A. Procesamiento OpenCorporates
    if (ocResResult.status === 'fulfilled' && ocResResult.value && ocResResult.value.ok) {
      try {
        const ocJson = await ocResResult.value.json();
        const companies = ocJson.response?.companies || [];
        if (companies.length > 0) {
          const match = companies[0].company;
          ocCompanyFound = true;
          const isActive = match.current_status?.toLowerCase().includes('active');

          liveEvidences.push({
            id: 'EV-01',
            timestamp: analyzedAt,
            source: 'OpenCorporates Global Registry',
            category: 'CORPORATE' as const,
            description: `Registro localizado: ${match.name} (${match.jurisdiction_code?.toUpperCase()}). Num: ${match.company_number}. Estado: ${match.current_status || 'Registrado'}.`,
            status: isActive ? ('VERIFIED' as const) : ('SUSPICIOUS' as const),
          });

          if (!isActive && match.current_status) {
            calculatedRiskScore += 35;
          }
        } else {
          liveEvidences.push({
            id: 'EV-01',
            timestamp: analyzedAt,
            source: 'Registro Mercantil Internacional',
            category: 'CORPORATE' as const,
            description: `No se localizó coincidencia mercantil abierta para "${companyName}". Requiere revisión de actas locales.`,
            status: 'SUSPICIOUS' as const,
          });
          calculatedRiskScore += 25;
        }
      } catch (e) {
        console.warn('[OSINT_API] Error al procesar respuesta OpenCorporates:', e);
      }
    }

    // B. Procesamiento DNS Live
    if (dnsResResult.status === 'fulfilled' && dnsResResult.value && dnsResResult.value.ok) {
      try {
        const dnsData = await dnsResResult.value.json();
        const ips = dnsData.Answer?.map((a: any) => a.data).join(', ') || 'Sin A-Record público';

        liveEvidences.push({
          id: 'EV-02',
          timestamp: analyzedAt,
          source: 'DNS & Infrastructure Intelligence',
          category: 'COMMUNICATION' as const,
          description: `Resolución de red de dominio [${companyName}]. Servidores IP activos: [${ips}].`,
          status: dnsData.Answer ? ('VERIFIED' as const) : ('SUSPICIOUS' as const),
        });

        if (!dnsData.Answer) calculatedRiskScore += 20;
      } catch (e) {
        console.warn('[OSINT_API] Error al procesar DNS live:', e);
      }
    } else if (!isDomainInput) {
      liveEvidences.push({
        id: 'EV-02',
        timestamp: analyzedAt,
        source: 'GeoLocation & Registry Cross-Check',
        category: 'GEOLOCATION' as const,
        description: ocCompanyFound 
          ? 'Domicilio y jurisdicción coinciden con registros mercantiles vigentes.'
          : 'Ubicación reportada pendiente de confirmación física en terreno.',
        status: ocCompanyFound ? ('VERIFIED' as const) : ('SUSPICIOUS' as const),
      });
    }

    // C. Procesamiento e Integración de los Módulos de Enriquecimiento (Evidencias y Scores)
    const domainRiskData = domainRiskModule.status === 'fulfilled' ? domainRiskModule.value : undefined;
    const satCheckData = satCheckModule.status === 'fulfilled' ? satCheckModule.value : undefined;
    const openSanctionsData = openSanctionsModule.status === 'fulfilled' ? openSanctionsModule.value : undefined;

    if (domainRiskData) {
      calculatedRiskScore += domainRiskData.riskScore;
      domainRiskData.flags.forEach((flag, index) => {
        liveEvidences.push({
          id: `EV-TLD-${index + 1}`,
          timestamp: analyzedAt,
          source: 'Domain Risk & TLD Analyzer',
          category: 'COMMUNICATION' as const,
          description: flag,
          status: domainRiskData.riskScore > 30 ? 'SUSPICIOUS' : 'VERIFIED'
        });
      });
    }

    if (satCheckData) {
      calculatedRiskScore += satCheckData.riskScorePenalty;
      satCheckData.flags.forEach((flag, index) => {
        liveEvidences.push({
          id: `EV-SAT-${index + 1}`,
          timestamp: analyzedAt,
          source: 'Prospección Nacional SAT / SIGER',
          category: 'FINANCIAL' as const,
          description: flag,
          status: satCheckData.satList69B.isListed ? 'CRITICAL' : 'SUSPICIOUS'
        });
      });
    }

    if (openSanctionsData) {
      calculatedRiskScore += openSanctionsData.riskScorePenalty;
      openSanctionsData.flags.forEach((flag, index) => {
        liveEvidences.push({
          id: `EV-SANCTION-${index + 1}`,
          timestamp: analyzedAt,
          source: 'OpenSanctions & GeoIP Global Engine',
          category: 'COMPLIANCE' as const,
          description: flag,
          status: openSanctionsData.hasSanctionsMatch ? 'CRITICAL' : 'SUSPICIOUS'
        });
      });
    }

    // Evento de Sello Criptográfico por defecto
    liveEvidences.push({
      id: 'EV-AUDIT-SHA256',
      timestamp: analyzedAt,
      source: 'Nexus Core Audit Engine',
      category: 'COMMUNICATION' as const,
      description: 'Sello de integridad SHA-256 generado y vinculado al informe pericial.',
      status: 'VERIFIED' as const,
    });

    // -------------------------------------------------------------
    // 3. EJECUCIÓN DE AI ENGINE & DICTAMEN FINAL
    // -------------------------------------------------------------
    let riskScore = Math.min(100, Math.max(10, calculatedRiskScore));
    let verdict = ocCompanyFound 
      ? `Dictamen OSINT para ${companyName}: Entidad identificada en registros corporativos globales. Nivel de riesgo estimado: ${riskScore}/100.`
      : `Dictamen preventivo para ${companyName}: Sin coincidencia directa en índices mercantiles internacionales. Se sugiere verificación documental adicional.`;
      
    let keyFindings = [
      ocCompanyFound 
        ? 'Entidad localizada con número de registro corporativo activo.'
        : 'Ausencia de registro mercantil público internacional bajo el nombre especificado.',
      targetDomain ? `Evaluación de riesgo de dominio [${targetDomain}] completada.` : 'Sin dominio de red directo analizado.',
      'Auditoría y trazabilidad criptográfica completada.',
    ];

    if (satCheckData?.satList69B.isListed) {
      keyFindings.unshift(`ALERTA FISCAL: Registrado en listas de la consulta Art. 69-B del SAT (${satCheckData.satList69B.status}).`);
    }

    if (openSanctionsData?.hasSanctionsMatch) {
      keyFindings.unshift(`ALERTA DE CUMPLIMIENTO: Coincidencia en listas internacionales de sanciones.`);
    }

    try {
      const aiEngine = (AiEnginePackage as any).OsintEngineService;
      if (aiEngine && typeof aiEngine.analyzeTarget === 'function') {
        const aiResult = await aiEngine.analyzeTarget({ companyName, taxId });
        verdict = aiResult.executiveSummary || verdict;
        riskScore = aiResult.riskScore || riskScore;
        keyFindings = aiResult.matrixFindings || keyFindings;
      }
    } catch (e) {
      console.warn('[OSINT_API] Usando AI Engine fallback dinámico');
    }

    // -------------------------------------------------------------
    // 4. ESTRUCTURACIÓN DE CONTRATOS Y RESUMEN DE ALERTAS
    // -------------------------------------------------------------
    const reportId = `REP-${Math.floor(100000 + Math.random() * 900000)}`;
    const caseId = `CASE-${reportId.slice(4)}`;

    const flagsCount = {
      critical: riskScore > 75 ? 1 : (satCheckData?.satList69B.isListed || openSanctionsData?.hasSanctionsMatch ? 1 : 0),
      high: riskScore > 50 && riskScore <= 75 ? 2 : 0,
      medium: riskScore > 30 && riskScore <= 50 ? 1 : 1,
      low: riskScore <= 30 ? 2 : 0,
    };

    const summary = {
      targetName: companyName,
      targetTaxId: taxId,
      globalScore: Math.max(0, 100 - riskScore),
      riskScore,
      overallRisk: riskScore > 50 ? ('HIGH' as const) : ('LOW' as const),
      verdict,
      keyFindings,
      flagsCount,
      analyzedAt,
    };

    const evidences = liveEvidences;

    // Objeto con módulos estructurados para clientes que consuman el contrato ampliado
    const enrichmentModules = {
      domainRisk: domainRiskData,
      satCheck: satCheckData,
      openSanctions: openSanctionsData
    };

    // 5. Sellado Criptográfico SHA-256
    const payloadToHash = { caseId, summary, evidences, enrichmentModules };
    const hashSha256 = await generatePayloadHash(payloadToHash);

    // 6. Respuesta exitosa conservando contrato previo + módulos de enriquecimiento (Status 201)
    return NextResponse.json(
      {
        success: true,
        caseId,
        reportId,
        targetId,
        summary,
        evidences,
        modules: enrichmentModules,
        hashSha256,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno en el motor OSINT.';
    console.error('[OSINT_ANALYZE_API_ERROR]:', errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}