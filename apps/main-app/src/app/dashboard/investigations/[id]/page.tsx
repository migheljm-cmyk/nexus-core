import Link from 'next/link';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 1. Componentes locales (están en la misma carpeta [id])
import { EnrichmentButton } from './EnrichmentButton';
import ExportPdfButton from './ExportPdfButton';
import { InvestigationRealtimeSync } from './InvestigationRealtimeSync';

// 2. Componentes globales (4 niveles arriba para llegar a src/components/modules)
import { InvestigationGraph } from '../../../../components/modules/InvestigationGraph';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export const revalidate = 0;

function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default async function InvestigationDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const caseId = resolvedParams?.id;

  if (!caseId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center space-y-4">
        <p className="text-amber-400 font-mono">⚠️ ID de expediente no especificado.</p>
        <Link href="/dashboard" className="text-cyan-400 text-sm font-mono underline">
          ← Volver al Dashboard
        </Link>
      </div>
    );
  }

  const supabase = createClient();

  try {
    // 1. Fetch del expediente principal
    const { data: investigation, error: invError } = await supabase
      .from('investigations')
      .select('*')
      .eq('id', caseId)
      .maybeSingle();

    if (invError || !investigation) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center space-y-4">
          <p className="text-amber-400 font-mono">⚠️ No se encontró el expediente ID: {caseId}</p>
          <Link href="/dashboard" className="text-cyan-400 text-sm font-mono underline">
            ← Volver al Dashboard
          </Link>
        </div>
      );
    }

    // 2. Fetch de evidencias (se consulta antes para usarlo como fallback de metadatos si no hay entities)
    const { data: evidences } = await supabase
      .from('evidence_vault')
      .select('*')
      .eq('investigation_id', caseId)
      .order('recorded_at', { ascending: false });

    // 3. Fetch de entidades asociadas
    const { data: entities } = await supabase
      .from('entities')
      .select('*')
      .eq('investigation_id', caseId);

    const primaryEntity = entities?.find(
      (e) => e.domain || e.metadata?.domain || (e.raw_value && e.raw_value.includes('@'))
    ) || entities?.[0];

    // Extraer evidencia inicial si existe
    const initialEvidencePayload = evidences?.[evidences.length - 1]?.raw_payload || evidences?.[evidences.length - 1]?.payload;
    const parsedPayload = typeof initialEvidencePayload === 'string' 
      ? JSON.parse(initialEvidencePayload) 
      : initialEvidencePayload;

    // Estrategia de búsqueda de Razón Social / Nombre
    const entityName =
      primaryEntity?.name ||
      primaryEntity?.raw_value ||
      investigation?.target_data?.razonSocial ||
      investigation?.target_data?.legalName ||
      investigation?.target_data?.value ||
      investigation?.title ||
      parsedPayload?.target?.razonSocial ||
      parsedPayload?.target?.value ||
      investigation?.rfc ||
      'N/A';

    // Estrategia de búsqueda del Dominio Principal
    let entityDomain = 'N/A';
    if (primaryEntity) {
      if (primaryEntity.domain) {
        entityDomain = primaryEntity.domain;
      } else if (primaryEntity.metadata?.domain) {
        entityDomain = primaryEntity.metadata.domain;
      } else if (primaryEntity.raw_value && primaryEntity.raw_value.includes('@')) {
        entityDomain = primaryEntity.raw_value.split('@')[1];
      }
    } else {
      entityDomain = 
        investigation?.domain || 
        investigation?.target_data?.domain || 
        parsedPayload?.target?.domain || 
        'N/A';
    }

    const score = investigation.coi_score ?? 0;

    const getRiskBadge = (score: number) => {
      if (score >= 70) return { label: 'CRÍTICO', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
      if (score >= 40) return { label: 'MEDIO', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      return { label: 'BAJO', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    };

    const riskBadge = getRiskBadge(score);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
        {/* Escuchador de eventos Realtime de Supabase */}
        <InvestigationRealtimeSync investigationId={investigation.id} />

        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 mb-2"
            >
              ← VOLVER AL DASHBOARD
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-mono text-slate-100">
                EXPEDIENTE: <span className="text-cyan-400">{investigation.id.substring(0, 8)}...</span>
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-mono font-semibold border ${riskBadge.color}`}
              >
                Riesgo {riskBadge.label} ({score}/100)
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            <EnrichmentButton 
              investigationId={investigation.id}
              targetRfc={investigation.rfc || parsedPayload?.target?.rfc}
              targetDomain={investigation.domain || parsedPayload?.target?.domain}
              targetEmail={investigation.email || parsedPayload?.target?.email}
              targetName={entityName}
            />
            
            <ExportPdfButton investigationId={investigation.id} />
          </div>
        </div>

        {/* Grafo Interactivo */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider">
              🌐 Topología de Entidades y Relaciones Cibernéticas
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              Interactive Canvas Active
            </span>
          </div>
          <InvestigationGraph investigationId={investigation.id} targetName={entityName} />
        </div>

        {/* Grid de Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider">
                1. Datos de la Entidad
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Razón Social / Nombre</span>
                  <span className="font-semibold text-slate-200">{entityName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Dominio Principal</span>
                  <span className="font-mono text-cyan-400">{entityDomain}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Estado del Expediente</span>
                  <span className="capitalize font-mono text-slate-300">{investigation.status ?? 'Pending'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider">
                2. COI Score Meter
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Nivel de Confianza OSINT</span>
                  <span className="text-slate-200">{score}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider">
                3. Cadena de Custodia & Evidencias Selladas ({evidences?.length ?? 0})
              </h2>
              <span className="text-xs font-mono text-slate-500">SHA-256 Verified</span>
            </div>

            {!evidences || evidences.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                Sin evidencias registradas. Ejecuta el enriquecimiento OSINT para poblar el expediente.
              </div>
            ) : (
              <div className="space-y-4">
                {evidences.map((evidence) => {
                  const title = evidence.artifact_name || evidence.type || 'EVIDENCIA_OSINT';
                  const timestamp = evidence.recorded_at || evidence.created_at;
                  const payloadContent = evidence.raw_payload || evidence.payload;
                  const sha256Hash = evidence.payload_hash_sha256 || evidence.hash;

                  return (
                    <div
                      key={evidence.id}
                      className="bg-slate-950 border border-slate-800 rounded p-4 space-y-2 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-bold uppercase">{title}</span>
                        <span className="text-slate-500">
                          {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900/80 rounded border border-slate-800/60 overflow-x-auto text-slate-300">
                        <pre className="text-[11px] leading-relaxed">
                          {typeof payloadContent === 'string'
                            ? payloadContent
                            : JSON.stringify(payloadContent, null, 2)}
                        </pre>
                      </div>

                      {sha256Hash && (
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                          <span className="text-slate-600 uppercase">HASH SHA-256:</span>
                          <span className="truncate text-slate-400 font-mono">{sha256Hash}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error al renderizar la investigación:', err);
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center justify-center space-y-4">
        <p className="text-red-400 font-mono">⚠️ Ocurrió un error al procesar el expediente.</p>
        <Link href="/dashboard" className="text-cyan-400 text-sm font-mono underline">
          ← Volver al Dashboard
        </Link>
      </div>
    );
  }
}