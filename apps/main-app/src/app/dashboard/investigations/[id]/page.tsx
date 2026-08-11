// apps/main-app/src/app/dashboard/investigations/[id]/page.tsx

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { EvidenceTimeline, EvidenceArtifact } from "@/components/modules/EvidenceTimeline";
import { OsintPdfReport } from "@/components/modules/OsintPdfReport";

interface PageProps {
  params: {
    id: string;
  };
}

// Inicialización del cliente administrativo de Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function InvestigationDetailPage({ params }: PageProps) {
  const { id } = params;

  // 1. Consulta simultánea de Expediente, Vault y Entidades en Supabase
  const [investigationRes, vaultRes, entitiesRes] = await Promise.all([
    supabaseAdmin
      .from("investigations")
      .select("*")
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("evidence_vault")
      .select("*")
      .eq("investigation_id", id)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("entities")
      .select("*")
      .eq("investigation_id", id),
  ]);

  if (investigationRes.error || !investigationRes.data) {
    notFound();
  }

  const investigation = investigationRes.data;
  const vaultItems = vaultRes.data || [];
  const entities = entitiesRes.data || [];

  // Mapeo para el componente EvidenceTimeline
  const artifacts: EvidenceArtifact[] = vaultItems.map((item) => ({
    id: item.id,
    artifactName: item.artifact_name,
    artifactType: item.artifact_type,
    payloadHashSha256: item.payload_hash_sha256,
    isSealed: item.is_sealed,
    createdAt: item.created_at,
  }));

  const rootHash = vaultItems[0]?.payload_hash_sha256 || "N/A";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Encabezado del Expediente */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              ID: {investigation.id}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                investigation.status === "ACTIVE"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {investigation.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-50 mt-2">
            {investigation.title}
          </h1>
          <p className="text-sm text-slate-400">
            Sujeto / Entidad Objetivo: <strong className="text-slate-200">{investigation.target_name}</strong>
          </p>
        </div>

        {/* Métricas rápidas */}
        <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-right">
            <span className="text-xs text-slate-500 block font-mono">COI RISK SCORE</span>
            <span
              className={`text-xl font-bold font-mono ${
                investigation.coi_score > 70
                  ? "text-rose-400"
                  : investigation.coi_score > 40
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {investigation.coi_score} / 100
            </span>
          </div>
        </div>
      </div>

      {/* Módulo de Exportación Legal a PDF */}
      <section>
        <OsintPdfReport
          investigationId={investigation.id}
          targetName={investigation.target_name}
          coiScore={investigation.coi_score}
          totalEntities={entities.length}
          vaultHash={rootHash}
        />
      </section>

      {/* Grid Principal: Timeline de Evidencias & Resumen de Entidades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Timeline (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <EvidenceTimeline artifacts={artifacts} />
        </div>

        {/* Columna Derecha: Panel de Entidades Desglosadas (1 Col) */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-100">
            Entidades Identificadas ({entities.length})
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {entities.map((entity) => (
              <div
                key={entity.id}
                className="bg-slate-900 border border-slate-800 rounded-md p-3 space-y-1 font-mono text-xs"
              >
                <div className="flex justify-between items-center text-slate-400">
                  <span className="uppercase text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                    {entity.type}
                  </span>
                  <span className="text-rose-400 font-semibold">
                    +{entity.risk_points} pts
                  </span>
                </div>
                <div className="text-slate-200 font-medium truncate pt-1">
                  {entity.normalized_value || entity.raw_value}
                </div>
              </div>
            ))}

            {entities.length === 0 && (
              <p className="text-xs text-slate-500 italic">
                No hay entidades registradas en este expediente.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}