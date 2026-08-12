// apps/main-app/src/app/api/v1/enrichment/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveDomainInfrastructure } from '../../../../lib/osint/enrichment/dnsResolver';
import { evaluateInfrastructureRisk } from '../../../../lib/osint/enrichment/infrastructureRisk';
import { generateForensicSeal } from '../../../../lib/osint/crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { investigation_id, tenant_id = '00000000-0000-0000-0000-000000000001' } = await req.json();

    if (!investigation_id) {
      return NextResponse.json(
        { error: 'investigation_id es requerido para ejecutar el enriquecimiento.' },
        { status: 400 }
      );
    }

    // 1. Obtener entidades de la investigación
    const { data: entities, error: entitiesError } = await supabaseAdmin
      .from('entities')
      .select('*')
      .eq('investigation_id', investigation_id)
      .eq('tenant_id', tenant_id);

    if (entitiesError || !entities || entities.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron entidades para enriquecer en este expediente.' },
        { status: 404 }
      );
    }

    // 2. Extraer dominios únicos de entidades
    const domainsToProcess = new Set<string>();
    
    entities.forEach((ent) => {
      const val = ent.normalized_value || ent.raw_value || '';
      const isEmail = ent.type === 'EMAIL' || ent.vector === 'EMAIL' || val.includes('@');
      const isDomain = ent.type === 'DOMAIN' || ent.vector === 'DOMAIN';

      if (isEmail && val.includes('@')) {
        const domain = val.split('@')[1]?.trim();
        if (domain) domainsToProcess.add(domain);
      } else if (isDomain && val) {
        domainsToProcess.add(val.trim());
      }
    });

    if (domainsToProcess.size === 0) {
      return NextResponse.json(
        { message: 'No hay vectores de dominio o correo elegibles para enriquecimiento DNS.' },
        { status: 200 }
      );
    }

    const enrichmentResults = [];
    let totalAddedRisk = 0;

    // 3. Procesar cada dominio
    for (const domain of Array.from(domainsToProcess)) {
      const dnsData = await resolveDomainInfrastructure(domain);
      const riskAssessment = evaluateInfrastructureRisk(dnsData);

      totalAddedRisk += riskAssessment.additionalRiskPoints;

      // Generar sello pericial del hallazgo OSINT
      const rawPayload = JSON.stringify({ dnsData, riskAssessment });
      const cryptoSeal = generateForensicSeal(rawPayload, tenant_id);

      // Guardar evidencia en la bóveda
      await supabaseAdmin.from('evidence_vault').insert({
        investigation_id,
        tenant_id,
        artifact_name: `OSINT-DNS-${domain.toUpperCase()}`,
        artifact_type: 'DNS_INFRASTRUCTURE_ENRICHMENT',
        raw_payload: rawPayload,
        payload_hash_sha256: cryptoSeal.sha256_hash,
        is_sealed: true,
      });

      enrichmentResults.push({
        domain,
        dns: dnsData,
        risk: riskAssessment,
        evidence_hash: cryptoSeal.sha256_hash,
      });
    }

    // 4. Actualizar el COI Score en la tabla investigations
    const { data: currentInv } = await supabaseAdmin
      .from('investigations')
      .select('coi_score, target_name')
      .eq('id', investigation_id)
      .single();

    const newCoiScore = Math.min(100, (currentInv?.coi_score || 0) + totalAddedRisk);

    await supabaseAdmin
      .from('investigations')
      .update({ coi_score: newCoiScore })
      .eq('id', investigation_id);

    // 5. Si el nuevo score cruza el umbral crítico (>= 70), disparar auto-webhook
    let webhookTriggered = false;
    if (newCoiScore >= 70 && (currentInv?.coi_score || 0) < 70) {
      const baseUrl = new URL(req.url).origin;
      fetch(`${baseUrl}/api/v1/webhooks/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigation_id,
          tenant_id,
          target_name: currentInv?.target_name || 'Objetivo Enriquecido',
          coi_score: newCoiScore,
        }),
      }).catch((err) => console.error('Error auto-disparando webhook post-enriquecimiento:', err));

      webhookTriggered = true;
    }

    return NextResponse.json({
      success: true,
      investigation_id,
      previous_coi_score: currentInv?.coi_score || 0,
      new_coi_score: newCoiScore,
      added_risk_points: totalAddedRisk,
      webhook_triggered: webhookTriggered,
      domains_processed: enrichmentResults.length,
      details: enrichmentResults,
    });
  } catch (err: any) {
    console.error('Error en pipeline de enriquecimiento OSINT:', err);
    return NextResponse.json(
      { error: 'Error general en enriquecimiento OSINT', details: err.message },
      { status: 500 }
    );
  }
}