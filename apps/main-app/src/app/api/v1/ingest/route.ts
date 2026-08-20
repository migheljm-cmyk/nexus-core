import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateForensicSeal } from '../../../../lib/osint/crypto';
import {
  parseEmailEntity,
  parsePhoneEntity,
  parseGeospatialEntity,
} from '../../../../lib/osint/parsers/entityParser';
import { calculateCoiScore } from '../../../../lib/osint/riskScore';
import { inngest } from '../../../../lib/inngest/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Normalización de payload (Soporte dual: Modal React / API Directa)
    const tenant_id = body.tenant_id || '00000000-0000-0000-0000-000000000001';
    const investigation_title = body.caseName || body.investigation_title || 'Auditoría Corporativa OSINT';
    const target = body.target || null;
    const priority = body.priority || 'MEDIUM';
    const raw_payload = body;

    // Inferencia de Target Name según el Vector Activo
    const target_name =
      target?.razonSocial ||
      target?.legalName ||
      target?.value ||
      body.target_name ||
      'Objetivo No Identificado';

    if (!raw_payload) {
      return NextResponse.json(
        { error: 'raw_payload es requerido para el pipeline.' },
        { status: 400 }
      );
    }

    // 1. Generación de Sello Criptográfico pericial SHA-256
    const cryptoSeal = generateForensicSeal(raw_payload, tenant_id);

    // 2. Extracción síncrona inicial de entidades
    const extractedEntities: any[] = [];
    
    if (Array.isArray(body.phones)) {
      for (const phone of body.phones) {
        const parsed = parsePhoneEntity(phone);
        if (parsed) extractedEntities.push(parsed);
      }
    }
    
    if (Array.isArray(body.emails)) {
      for (const email of body.emails) {
        const parsed = parseEmailEntity(email);
        if (parsed) extractedEntities.push(parsed);
      }
    }

    if (Array.isArray(body.addresses)) {
      for (const address of body.addresses) {
        const parsed = parseGeospatialEntity(address);
        if (parsed) extractedEntities.push(parsed);
      }
    }

    // Extracción rápida si viene desde DIGITAL_TELECOM (Email o Phone directo)
    if (target?.targetType === 'DIGITAL_TELECOM' && target?.value) {
      if (target.inputCategory === 'EMAIL') {
        const parsed = parseEmailEntity(target.value);
        if (parsed) extractedEntities.push(parsed);
      } else if (target.inputCategory === 'PHONE') {
        const parsed = parsePhoneEntity(target.value);
        if (parsed) extractedEntities.push(parsed);
      }
    }

    // 3. Score COI Inicial
    const coiResult = calculateCoiScore(extractedEntities);

    // 4. INSERTAR INVESTIGACIÓN EN SUPABASE (Con manejo de error preventivo)
    let invData: { id: string } | null = null;
    
    const { data, error: invError } = await supabase
      .from('investigations')
      .insert({
        tenant_id,
        title: investigation_title,
        target_name,
        coi_score: coiResult.score,
        status: 'PENDING',
      })
      .select()
      .single();

    if (invError) {
      console.warn('⚠️ ADVERTENCIA: Falló inserción en Supabase (Usando ID temporal de fallback):', invError.message);
      // Fallback a UUID temporal si la DB local no está lista o falta la tabla
      invData = { id: `inv_${Date.now()}` };
    } else {
      invData = data;
    }

    // 5. REGISTRO EN BÓVEDA DE EVIDENCIA (CHAIN OF CUSTODY)
    if (invData && !invError) {
      const { error: vaultError } = await supabase.from('evidence_vault').insert({
        investigation_id: invData.id,
        tenant_id,
        artifact_name: `EVIDENCIA-${Date.now()}`,
        artifact_type: 'RAW_INGEST_PAYLOAD',
        raw_payload,
        payload_hash_sha256: cryptoSeal.sha256_hash,
        is_sealed: true,
      });

      if (vaultError) {
        console.error('⚠️ FALLÓ INSERCIÓN EN EVIDENCE_VAULT:', vaultError.message);
      }
    }

    // 6. PERSISTIR ENTIDADES INICIALES
    if (extractedEntities.length > 0 && invData && !invError) {
      const entitiesToInsert = extractedEntities.map((e) => ({
        investigation_id: invData!.id,
        tenant_id,
        vector: e.vector,
        type: e.type,
        raw_value: e.rawValue,
        normalized_value: e.normalizedValue,
        metadata: e.metadata,
        risk_points: e.riskPoints,
      }));

      await supabase.from('entities').insert(entitiesToInsert);
    }

    // 7. DISPARO ASÍNCRONO DEL WORKER DE RASTREO ONLINE (INNGEST ENGINE)
    // Coincide exactamente con la función processOsintInvestigation registrada
    await inngest.send({
      name: 'investigation/created',
      data: {
        investigationId: invData.id,
        tenant_id,
        target,
        caseName: investigation_title,
        priority,
        rawPayload: raw_payload,
      },
    });

    console.log('✅ Ingesta procesada correctamente y despachada a Inngest');

    return NextResponse.json({
      success: true,
      data: {
        investigation_id: invData.id,
        tenant_id,
        seal: cryptoSeal,
        coi_score: coiResult,
        entities_count: extractedEntities.length,
        persisted: !invError,
        queued_for_osint: true,
      },
    });
  } catch (error: any) {
    console.error('❌ ERROR INESPERADO EN PIPELINE DE INGESTA:', error);
    return NextResponse.json(
      { success: false, error: 'Error general en pipeline', message: error.message },
      { status: 500 }
    );
  }
}