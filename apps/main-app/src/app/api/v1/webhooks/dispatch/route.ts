// apps/main-app/src/app/api/v1/webhooks/dispatch/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DispatchRequestBody {
  investigation_id: string;
  tenant_id: string;
  target_name: string;
  coi_score: number;
}

interface WebhookPayload {
  event: 'RISK_THRESHOLD_EXCEEDED';
  platform: 'NEXUS-CORE B2B OSINT';
  tenant_id: string;
  investigation_id: string;
  target_name: string;
  coi_score: number;
  timestamp: string;
}

export async function POST(req: Request) {
  try {
    const body: DispatchRequestBody = await req.json();
    const { investigation_id, tenant_id, target_name, coi_score } = body;

    // 1. Verificación Estricta de Umbral Crítico
    if (!coi_score || coi_score < 70) {
      return NextResponse.json(
        { message: 'El COI score no supera el umbral crítico (>= 70). Dispatch ignorado.' },
        { status: 200 }
      );
    }

    // 2. Obtener los Webhooks activos para este Tenant desde Supabase
    const { data: webhooks, error: webhookError } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true);

    if (webhookError || !webhooks || webhooks.length === 0) {
      return NextResponse.json(
        { message: 'No hay webhooks activos configurados para este Tenant.' },
        { status: 200 }
      );
    }

    // 3. Estructurar el Payload Estandarizado de la Alerta
    const payload: WebhookPayload = {
      event: 'RISK_THRESHOLD_EXCEEDED',
      platform: 'NEXUS-CORE B2B OSINT',
      tenant_id,
      investigation_id,
      target_name,
      coi_score,
      timestamp: new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);
    const dispatchResults = [];

    // 4. Despacho Multi-Endpoint con Criptografía HMAC-SHA256
    for (const hook of webhooks) {
      // Generar Firma Criptográfica HMAC
      const signature = crypto
        .createHmac('sha256', hook.secret_key)
        .update(payloadString)
        .digest('hex');

      let responseStatus = 0;
      let responseBodyText = '';
      let isSuccess = false;

      try {
        const response = await fetch(hook.target_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Nexus-Signature': signature,
            'X-Nexus-Event': payload.event,
            'User-Agent': 'NEXUS-CORE-OutboundEngine/1.0',
          },
          body: payloadString,
        });

        responseStatus = response.status;
        responseBodyText = await response.text();
        isSuccess = response.ok;
      } catch (fetchErr: any) {
        responseBodyText = fetchErr.message || 'Error de conexión / Timeout';
      }

      // 5. Registrar Log de Entrega y Cadena de Custodia en Supabase
      await supabaseAdmin.from('webhook_logs').insert({
        webhook_id: hook.id,
        investigation_id: investigation_id,
        event_type: payload.event,
        payload: payload,
        response_status: responseStatus,
        response_body: responseBodyText.slice(0, 1000), // Truncar para evitar overflow
        delivery_success: isSuccess,
      });

      dispatchResults.push({
        webhook_id: hook.id,
        target_url: hook.target_url,
        success: isSuccess,
        status_code: responseStatus,
        signature_generated: signature,
      });
    }

    return NextResponse.json({
      status: 'PROCESSED',
      investigation_id,
      coi_score,
      dispatched_count: dispatchResults.length,
      details: dispatchResults,
    });

  } catch (err: any) {
    console.error('Error en Webhook Dispatcher:', err);
    return NextResponse.json(
      { error: 'Error interno en el despacho de webhooks', details: err.message },
      { status: 500 }
    );
  }
}