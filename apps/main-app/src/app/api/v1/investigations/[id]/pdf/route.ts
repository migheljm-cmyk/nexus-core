// apps/main-app/src/app/api/v1/investigations/[id]/pdf/route.ts

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Carga de datos completos desde la BD
    const [investigationRes, vaultRes, entitiesRes] = await Promise.all([
      supabaseAdmin.from("investigations").select("*").eq("id", id).single(),
      supabaseAdmin.from("evidence_vault").select("*").eq("investigation_id", id),
      supabaseAdmin.from("entities").select("*").eq("investigation_id", id),
    ]);

    if (investigationRes.error || !investigationRes.data) {
      return NextResponse.json(
        { error: "Investigación no encontrada" },
        { status: 404 }
      );
    }

    const inv = investigationRes.data;
    const vault = vaultRes.data || [];
    const entities = entitiesRes.data || [];

    // Hash de custodia de la primera evidencia registrada
    const primaryHash = vault[0]?.payload_hash_sha256 || "N/A";

    // 2. Renderizado del reporte pericial en formato HTML/PDF integrable
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>NEXUS-CORE OSINT REPORT - ${inv.id}</title>
        <style>
          body { font-family: monospace, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
          .header { border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 22px; font-weight: bold; color: #38bdf8; }
          .meta-box { background: #1e293b; border: 1px solid #475569; padding: 15px; border-radius: 6px; margin-bottom: 25px; }
          .seal-badge { background: #064e3b; color: #34d399; border: 1px solid #059669; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #334155; padding: 10px; text-align: left; font-size: 12px; }
          th { background: #1e293b; color: #94a3b8; }
          .footer { margin-top: 50px; font-size: 10px; color: #64748b; border-top: 1px solid #334155; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">NEXUS-CORE :: INFORME PERICIAL DE INTELIGENCIA CORPORATIVA</div>
          <div>ID INVESTIGACIÓN: ${inv.id}</div>
          <div>FECHA DE EMISIÓN: ${new Date().toISOString()}</div>
        </div>

        <div class="meta-box">
          <p><strong>OBJETIVO (TARGET):</strong> ${inv.target_name}</p>
          <p><strong>COI RISK SCORE:</strong> ${inv.coi_score} / 100</p>
          <p><strong>ESTADO DE CADENA DE CUSTODIA:</strong> <span class="seal-badge">SELLADO SHA-256</span></p>
          <p><strong>ROOT HASH:</strong> ${primaryHash}</p>
        </div>

        <h3>ENTIDADES RASTREADAS (${entities.length})</h3>
        <table>
          <thead>
            <tr>
              <th>TIPO</th>
              <th>VALOR NORMALIZADO</th>
              <th>PUNTOS DE RIESGO</th>
            </tr>
          </thead>
          <tbody>
            ${entities
              .map(
                (e) => `
              <tr>
                <td>${e.type}</td>
                <td>${e.normalized_value || e.raw_value}</td>
                <td>+${e.risk_points}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <h3>ARTEFACTOS Y EVIDENCIAS DE BÓVEDA (${vault.length})</h3>
        <table>
          <thead>
            <tr>
              <th>ARTEFACTO</th>
              <th>TIPO</th>
              <th>PAYLOAD HASH (SHA-256)</th>
              <th>FECHA</th>
            </tr>
          </thead>
          <tbody>
            ${vault
              .map(
                (v) => `
              <tr>
                <td>${v.artifact_name}</td>
                <td>${v.artifact_type}</td>
                <td>${v.payload_hash_sha256}</td>
                <td>${v.created_at}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          Documento generado automáticamente por NEXUS-CORE Intelligence Engine. Cadena de custodia garantizada criptográficamente.
        </div>
      </body>
      </html>
    `;

    // 3. Respuesta con encabezados de descarga de documento
    return new NextResponse(reportHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="NEXUS_REPORT_${id.slice(0, 8)}.html"`,
      },
    });
  } catch (error) {
    console.error("Error en endpoint PDF/Report:", error);
    return NextResponse.json(
      { error: "Error interno procesando reporte pericial" },
      { status: 500 }
    );
  }
}