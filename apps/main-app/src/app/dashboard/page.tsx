// apps/main-app/src/app/dashboard/page.tsx

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Tenant predeterminado o extraído de la sesión/encabezados
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

// Inicialización del cliente administrativo de Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DashboardProps {
  searchParams?: {
    query?: string;
    risk?: "critical" | "medium" | "low";
    status?: string;
  };
}

export default async function DashboardOverviewPage({ searchParams }: DashboardProps) {
  const query = searchParams?.query || "";
  const risk = searchParams?.risk || "";
  const status = searchParams?.status || "";

  // 1. Construcción de consulta dinámica sobre investigaciones según parámetros de búsqueda
  let investigationsQuery = supabaseAdmin
    .from("investigations")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .order("created_at", { ascending: false });

  // Filtro Full-Text sobre Target Name o Título
  if (query) {
    investigationsQuery = investigationsQuery.or(
      `target_name.ilike.%${query}%,title.ilike.%${query}%`
    );
  }

  // Filtro dinámico por Umbral COI
  if (risk === "critical") {
    investigationsQuery = investigationsQuery.gte("coi_score", 70);
  } else if (risk === "medium") {
    investigationsQuery = investigationsQuery.gte("coi_score", 30).lt("coi_score", 70);
  } else if (risk === "low") {
    investigationsQuery = investigationsQuery.lt("coi_score", 30);
  }

  // Filtro por Estado de Expediente
  if (status) {
    investigationsQuery = investigationsQuery.eq("status", status);
  }

  // 2. Ejecución paralela: Investigaciones filtradas + Conteo exacto de Entidades
  const [investigationsRes, entitiesCountRes] = await Promise.all([
    investigationsQuery,
    supabaseAdmin
      .from("entities")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", DEFAULT_TENANT_ID),
  ]);

  const investigations = investigationsRes.data || [];
  const totalEntities = entitiesCountRes.count || 0;

  // 3. Cálculo de Métricas Globales (sobre los datos procesados)
  const totalInvestigations = investigations.length;
  const highRiskCount = investigations.filter((inv) => inv.coi_score >= 70).length;
  const avgCoiScore =
    totalInvestigations > 0
      ? Math.round(
          investigations.reduce((acc, inv) => acc + (inv.coi_score || 0), 0) /
            totalInvestigations
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Encabezado del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              NEXUS-CORE // ENTERPRISE OSINT
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-50 mt-1">
            Panel de Inteligencia Corporativa
          </h1>
          <p className="text-sm text-slate-400">
            Supervisión general de riesgos, evaluación de hallazgos y cadena de custodia.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-400">
            TENANT: <span className="text-slate-200">{DEFAULT_TENANT_ID.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Métricas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Métrica 1: Total Investigaciones */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">
            EXPEDIENTES MOSTRADOS
          </span>
          <div className="text-3xl font-bold font-mono text-slate-100">
            {totalInvestigations}
          </div>
          <p className="text-[11px] text-slate-500">
            Investigaciones activas e históricas.
          </p>
        </div>

        {/* Métrica 2: COI Promedio */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">
            PROMEDIO RIESGO COI
          </span>
          <div
            className={`text-3xl font-bold font-mono ${
              avgCoiScore >= 70
                ? "text-rose-400"
                : avgCoiScore >= 40
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {avgCoiScore} <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Nivel global de conflicto e interés.
          </p>
        </div>

        {/* Métrica 3: Expedientes de Alto Riesgo */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">
            ALTO RIESGO (&ge;70)
          </span>
          <div className="text-3xl font-bold font-mono text-rose-400">
            {highRiskCount}
          </div>
          <p className="text-[11px] text-slate-500">
            Requieren atención/revisión prioritaria.
          </p>
        </div>

        {/* Métrica 4: Entidades Rastreadas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">
            ENTIDADES EXTRAÍDAS
          </span>
          <div className="text-3xl font-bold font-mono text-sky-400">
            {totalEntities}
          </div>
          <p className="text-[11px] text-slate-500">
            Teléfonos, emails y direcciones analizadas.
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda Dinámica */}
      <form
        method="GET"
        className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-lg font-mono text-xs"
      >
        <input
          type="text"
          name="query"
          defaultValue={query}
          placeholder="Buscar por objetivo o título..."
          className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />

        <select
          name="risk"
          defaultValue={risk}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Todos los Rangos COI</option>
          <option value="critical">Crítico (COI &ge; 70)</option>
          <option value="medium">Medio (30 &le; COI &lt; 70)</option>
          <option value="low">Bajo (COI &lt; 30)</option>
        </select>

        <select
          name="status"
          defaultValue={status}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Todos los Estados</option>
          <option value="ACTIVE">Activo (ACTIVE)</option>
          <option value="PENDING">Pendiente (PENDING)</option>
          <option value="ARCHIVED">Archivado (ARCHIVED)</option>
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded py-2 transition-colors uppercase tracking-wider"
          >
            Filtrar
          </button>
          {(query || risk || status) && (
            <Link
              href="/dashboard"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center transition-colors flex items-center justify-center"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {/* Tabla de Investigaciones */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden space-y-4 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-100">
            Investigaciones Recientes
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Mostrando {investigations.length} expedientes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">ID / TÍTULO</th>
                <th className="p-3">TARGET</th>
                <th className="p-3">COI SCORE</th>
                <th className="p-3">ESTADO</th>
                <th className="p-3">FECHA</th>
                <th className="p-3 text-right">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {investigations.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">
                      {inv.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                      {inv.id}
                    </div>
                  </td>
                  <td className="p-3 text-slate-300 font-sans font-medium">
                    {inv.target_name}
                  </td>
                  <td className="p-3 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        inv.coi_score >= 70
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : inv.coi_score >= 40
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {inv.coi_score} / 100
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded uppercase">
                      {inv.status || "ACTIVE"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {new Date(inv.created_at).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/dashboard/investigations/${inv.id}`}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors border border-slate-700 inline-block"
                    >
                      Ver Expediente &rarr;
                    </Link>
                  </td>
                </tr>
              ))}

              {investigations.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-slate-500 italic font-sans"
                  >
                    No se encontraron investigaciones con los criterios seleccionados. Utiliza la API de Ingesta (<code className="text-slate-400">/api/v1/ingest</code>) para registrar nuevos objetivos o ajusta los filtros de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}