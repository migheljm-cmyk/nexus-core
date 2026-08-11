// apps/main-app/src/app/api/v1/ingest/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateForensicSeal } from '../../../../lib/osint/crypto';
import { parseEmailEntity, parsePhoneEntity, parseGeospatialEntity } from '../../../../lib/osint/parsers/entityParser';
import { calculateCoiScore } from '../../../../lib/osint/riskScore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      tenant_id = '00000000-0000-0000-0000-000000000001', 
      investigation_title = 'Auditoría Corporativa', 
      target_name = 'Objetivo No Identificado',
      raw_payload, 
      phones = [], 
      emails = [], 
      addresses = [] 
    } = body;

    if (!raw_payload) {
      return NextResponse.json({ error: 'raw_payload es requerido para el pipeline.' }, { status: 400 });
    }

    // 1. Sello Criptográfico
    const cryptoSeal = generateForensicSeal(raw_payload, tenant_id);

    // 2. Extracción de Entidades
    const extractedEntities = [];
    for (const phone of phones) {
      const parsed = parsePhoneEntity(phone);
      if (parsed) extractedEntities.push(parsed);
    }
    for (const email of emails) {
      const parsed = parseEmailEntity(email);
      if (parsed) extractedEntities.push(parsed);
    }
    for (const address of addresses) {
      const parsed = parseGeospatialEntity(address);
      if (parsed) extractedEntities.push(parsed);
    }

    // 3. Score COI
    const coiResult = calculateCoiScore(extractedEntities);

    // 4. INSERTAR INVESTIGACIÓN
    const { data: invData, error: invError } = await supabase
      .from('investigations')
      .insert({
        tenant_id,
        title: investigation_title,
        target_name,
        coi_score: coiResult.score,
        status: 'IN_PROGRESS'
      })
      .select()
      .single();

    if (invError) {
      console.error('❌ FALLÓ INSERCIÓN EN INVESTIGATIONS:', invError);
      return NextResponse.json({ 
        stage: 'INVESTIGATIONS_TABLE_FAIL', 
        message: invError.message 
      }, { status: 500 });
    }

    // 5. BÓVEDA DE EVIDENCIA
    const { error: vaultError } = await supabase
      .from('evidence_vault')
      .insert({
        investigation_id: invData.id,
        tenant_id,
        artifact_name: `EVIDENCIA-${Date.now()}`,
        artifact_type: 'RAW_INGEST_PAYLOAD',
        raw_payload,
        payload_hash_sha256: cryptoSeal.sha256_hash,
        is_sealed: true
      });

    if (vaultError) {
      console.error('❌ FALLÓ INSERCIÓN EN EVIDENCE_VAULT:', vaultError);
      return NextResponse.json({ 
        stage: 'VAULT_TABLE_FAIL', 
        message: vaultError.message 
      }, { status: 500 });
    }

    // 6. PERSISTIR ENTIDADES
    if (extractedEntities.length > 0) {
      const entitiesToInsert = extractedEntities.map(e => ({
        investigation_id: invData.id,
        tenant_id,
        vector: e.vector,
        type: e.type,
        raw_value: e.rawValue,
        normalized_value: e.normalizedValue,
        metadata: e.metadata,
        risk_points: e.riskPoints
      }));

      const { error: entitiesError } = await supabase
        .from('entities')
        .insert(entitiesToInsert);

      if (entitiesError) {
        console.error('❌ FALLÓ INSERCIÓN EN ENTITIES:', entitiesError);
        return NextResponse.json({ 
          stage: 'ENTITIES_TABLE_FAIL', 
          message: entitiesError.message 
        }, { status: 500 });
      }
    }

    // 7. AUTO-DISPARO DE WEBHOOKS SI COI >= 70 (EJECUCIÓN ASÍNCRONA EN SEGUNDO PLANO)
    if (coiResult.score >= 70) {
      const baseUrl = new URL(request.url).origin;
      
      fetch(`${baseUrl}/api/v1/webhooks/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigation_id: invData.id,
          tenant_id,
          target_name,
          coi_score: coiResult.score,
        }),
      }).catch((dispatchErr) => {
        console.error('⚠️ ERROR AL INVOCAR DESPACHO ASÍNCRONO DE WEBHOOK:', dispatchErr);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        investigation_id: invData.id,
        tenant_id,
        seal: cryptoSeal,
        coi_score: coiResult,
        entities_count: extractedEntities.length,
        persisted: true,
        webhook_triggered: coiResult.score >= 70
      },
    });

  } catch (error: any) {
    console.error('❌ ERROR INESPERADO:', error);
    return NextResponse.json(
      { error: 'Error general en pipeline', message: error.message },
      { status: 500 }
    );
  }
}