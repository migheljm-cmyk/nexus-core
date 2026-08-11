// apps/main-app/src/app/api/v1/ingest/route.ts
import { NextResponse } from 'next/server';
import { generateForensicSeal } from '@/lib/osint/crypto';
import { parseEmailEntity, parsePhoneEntity, parseGeospatialEntity } from '@/lib/osint/parsers/entityParser';
import { calculateCoiScore } from '@/lib/osint/riskScore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, investigation_id, raw_payload, phones = [], emails = [], addresses = [] } = body;

    if (!tenant_id || !raw_payload) {
      return NextResponse.json(
        { error: 'tenant_id y raw_payload son requeridos.' },
        { status: 400 }
      );
    }

    // 1. Sello Criptográfico SHA-256 (Cadena de Custodia)
    const cryptoSeal = generateForensicSeal(raw_payload, tenant_id);

    // 2. Extracción y Normalización de Entidades (4 Vectores)
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

    // 3. Engine de Scoring COI
    const coiResult = calculateCoiScore(extractedEntities);

    // 4. Respuesta estructurada lista para almacenamiento / UI
    return NextResponse.json({
      success: true,
      data: {
        investigation_id: investigation_id || `INV-${Date.now()}`,
        seal: cryptoSeal,
        entities: extractedEntities,
        coi_score: coiResult,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Error en el pipeline de ingesta', details: error.message },
      { status: 500 }
    );
  }
}