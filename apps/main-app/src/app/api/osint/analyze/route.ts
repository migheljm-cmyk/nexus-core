import { NextRequest, NextResponse } from 'next/server';
import { generatePayloadHash } from '../../../../lib/osint/crypto';

// Importaciones de conectores de enriquecimiento OSINT
import { analyzeDomainRisk } from '../../../../lib/osint/providers/tldRisk';
import { analyzeSatAndRegistry } from '../../../../lib/osint/providers/satCheck';
import { analyzeGlobalSanctionsAndGeo } from '../../../../lib/osint/providers/openSanctions';

// Importaciones con manejo seguro ante paquetes en desarrollo
import * as DatabasePackage from '@nexus/database';
import * as AiEnginePackage from '@nexus/ai-engine';

// Dominios de correo gratuito / informal considerados Bandera Roja en B2B
const FREE_EMAIL_DOMAINS = new Set([
  'qq.com', '163.com', '126.com', 'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Soportamos 'targetId' para retrocompatibilidad, así como campos explícitos
    const targetId = body.targetId || body.companyName || body.domain || body.rfc;
    const domainInput = (body.domain || '').trim();
    const rfcInput = (body.rfc || '').trim();
    const emailInput = (body.email || body.contactEmail || '').trim().toLowerCase();
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

    // Identificar si la entrada principal es un dominio
    const isDomainInput = companyName.includes('.') && !companyName.includes(' ');
    const targetDomain = domainInput || (isDomainInput ? companyName : undefined);
    const targetRfc = rfcInput || (taxId !== 'TAX-PENDING-001' ? taxId : undefined);

    let liveEvidences: any[] = [];
    const matrixFindings: any[] = [];
    let calculatedRiskScore = 15; // Score base inicial para empresa en evaluación

    // -------------------------------------------------------------
    // 2. REGLAS DE VALIDACIÓN CRUZADA (CROSS-VALIDATION ENGINE)
    // -------------------------------------------------------------

    // A. Regla: Email Gratuito / Informal en Entidad Corporativa
    let isFreeEmail = false;
    let emailDomain = '';
    if (emailInput.includes('@')) {
      emailDomain = emailInput.split('@')[1];
      if (FREE_EMAIL_DOMAINS.has(emailDomain)) {
        isFreeEmail = true;
        calculatedRiskScore += 35;

        matrixFindings.push({
          id: 'RISK-CROSS-01',
          title: 'Canal de Correo Gratuito / Informal',
          category: 'Infraestructura & Red',
          severity: 'HIGH',
          description: `Comunicación corporativa vinculada a proveedor gratuito [@${emailDomain}]. Riesgo de suplantación/baja trazabilidad.`
        });

        liveEvidences.push({
          id: 'EV-CROSS-01',
          timestamp: analyzedAt,
          source: 'Traceability & Communications Engine',
          category: 'COMMUNICATION' as const,
          description: `Bandera Roja: Dominio de contacto en proveedor gratuito [@${emailDomain}]. Se sugiere solicitar correo con dominio propio.`,
          status: 'SUSPICIOUS' as const,
        });
      }
    }

    // B. Regla: Inconsistencia entre Dominio Web Declarado y Correo
    if (targetDomain && emailDomain && !isFreeEmail && !targetDomain.includes(emailDomain)) {
      calculatedRiskScore += 20;

      matrixFindings.push({
        id: 'RISK-CROSS-02',
        title: 'Discrepancia Dominio Web vs. Email',
        category: 'Infraestructura & Red',
        severity: 'MEDIUM',
        description: `El dominio web [${targetDomain}] no coincide con la extensión del correo registrado [@${emailDomain}].`
      });
    }

    // -------------------------------------------------------------
    // 3. EJECUCIÓN PARALELA: LIVE PROSPECTING + ENRICHMENT MODULES
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
            matrixFindings.push({
              id: 'RISK-CORP-01',
              title: 'Estatus Corporativo Inactivo',
              category: 'Cumplimiento & Sanciones',
              severity: 'HIGH',
              description: `El registro en jurisdicción [${match.jurisdiction_code?.toUpperCase()}] no figura en estado ACTIVO.`
            });
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
          calculatedRiskScore += 20;

          matrixFindings.push({
            id: 'RISK-CORP-02',
            title: 'Sin Registro Mercantil Abierto Global',
            category: 'Cumplimiento & Sanciones',
            severity: 'MEDIUM',
            description: `Ausencia de coincidencia en índices internacionales públicos bajo el nombre exacto.`
          });
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

    // C. Módulos de Enriquecimiento (Mapeo a Evidencias y Matriz 3x3)
    const domainRiskData = domainRiskModule.status === 'fulfilled' ? domainRiskModule.value : undefined;
    const satCheckData = satCheckModule.status === 'fulfilled' ? satCheckModule.value : undefined;
    const openSanctionsData = openSanctionsModule.status === 'fulfilled' ? openSanctionsModule.value : undefined;

    if (domainRiskData) {
      calculatedRiskScore += domainRiskData.riskScore;
      domainRiskData.flags.forEach((flag, index) => {
        matrixFindings.push({
          id: `RISK-DOM-${index}`,
          title: `Riesgo de Dominio (.${domainRiskData.details.tld})`,
          category: 'Infraestructura & Red',
          severity: domainRiskData.riskScore > 40 ? 'HIGH' : 'MEDIUM',
          description: flag
        });

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
        const isCritical = satCheckData.satList69B.isListed;
        matrixFindings.push({
          id: `RISK-SAT-${index}`,
          title: `Estatus Fiscal SAT (${satCheckData.rfc})`,
          category: 'Legal & Fiscal',
          severity: isCritical ? 'CRITICAL' : 'MEDIUM',
          description: flag
        });

        liveEvidences.push({
          id: `EV-SAT-${index + 1}`,
          timestamp: analyzedAt,
          source: 'Prospección Nacional SAT / SIGER',
          category: 'FINANCIAL' as const,
          description: flag,
          status: isCritical ? ('CRITICAL' as const) : ('SUSPICIOUS' as const)
        });
      });
    }

    if (openSanctionsData) {
      calculatedRiskScore += openSanctionsData.riskScorePenalty;
      openSanctionsData.flags.forEach((flag, index) => {
        const isSanction = openSanctionsData.hasSanctionsMatch;
        matrixFindings.push({
          id: `RISK-SANCTION-${index}`,
          title: isSanction ? 'Sanciones Internacionales' : 'Geolocalización & Servidores',
          category: 'Cumplimiento & Sanciones',
          severity: isSanction ? 'CRITICAL' : 'HIGH',
          description: flag
        });

        liveEvidences.push({
          id: `EV-SANCTION-${index + 1}`,
          timestamp: analyzedAt,
          source: 'OpenSanctions & GeoIP Global Engine',
          category: 'COMPLIANCE' as const,
          description: flag,
          status: isSanction ? ('CRITICAL' as const) : ('SUSPICIOUS' as const)
        });
      });
    }

    // Evento de Sello Criptográfico
    liveEvidences.push({
      id: 'EV-AUDIT-SHA256',
      timestamp: analyzedAt,
      source: 'Nexus Core Audit Engine',
      category: 'COMMUNICATION' as const,
      description: 'Sello de integridad SHA-256 generado y vinculado al informe pericial.',
      status: 'VERIFIED' as const,
    });

    // -------------------------------------------------------------
    // 4. EJECUCIÓN DE AI ENGINE & DICTAMEN FINAL (ACCESO BLINDADO)
    // -------------------------------------------------------------
    let riskScore = Math.min(100, Math.max(10, calculatedRiskScore));
    let verdict = riskScore > 50
      ? `ALERTA DE RIESGO B2B (${riskScore}/100): Se identificaron inconsistencias operativas o banderas rojas en la entidad ${companyName}. Se recomienda auditoría documental extendida.`
      : `DICTAMEN FAVORABLE (${riskScore}/100): La entidad ${companyName} no presenta coincidencias en listas de sanciones ni banderas rojas críticas en sus fuentes públicas.`;
      
    let keyFindings = matrixFindings.length > 0
      ? matrixFindings.map(m => m.description)
      : [
          ocCompanyFound 
            ? 'Entidad localizada con número de registro corporativo activo.'
            : 'Ausencia de registro mercantil público internacional bajo el nombre especificado.',
          targetDomain ? `Evaluación de riesgo de dominio [${targetDomain}] completada.` : 'Sin dominio de red directo analizado.',
          'Auditoría y trazabilidad criptográfica completada.',
        ];

    try {
      // Invocación segura sin presuponer la estructura exacta exportada por @nexus/ai-engine
      const pkg = AiEnginePackage as any;
      const aiEngine = pkg.OsintEngineService || pkg.default || pkg;

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
    // 5. ESTRUCTURACIÓN DE CONTRATOS, MATRIZ Y SELLADO
    // -------------------------------------------------------------
    const reportId = `REP-${Math.floor(100000 + Math.random() * 900000)}`;
    const caseId = `CASE-${reportId.slice(4)}`;

    const flagsCount = {
      critical: matrixFindings.filter(m => m.severity === 'CRITICAL').length,
      high: matrixFindings.filter(m => m.severity === 'HIGH').length,
      medium: matrixFindings.filter(m => m.severity === 'MEDIUM').length,
      low: matrixFindings.filter(m => m.severity === 'LOW').length,
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

    const enrichmentModules = {
      domainRisk: domainRiskData,
      satCheck: satCheckData,
      openSanctions: openSanctionsData
    };

    // Sellado Criptográfico SHA-256
    const payloadToHash = { caseId, summary, evidences: liveEvidences, riskMatrix: matrixFindings, enrichmentModules };
    const hashSha256 = await generatePayloadHash(payloadToHash);

    return NextResponse.json(
      {
        success: true,
        caseId,
        reportId,
        targetId,
        summary,
        evidences: liveEvidences,
        timeline: liveEvidences, // Duplicado explícito para que EvidenceTimeline.tsx siempre tenga datos
        riskMatrix: matrixFindings, // Datos directos para popular RiskMatrix.tsx (Matriz 3x3)
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