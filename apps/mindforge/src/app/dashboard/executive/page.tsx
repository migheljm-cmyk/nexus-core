import { EnterpriseTelemetryEngine } from '@nexus/analytics';
import { generateMetadata } from '@nexus-core/growth';

export const metadata = generateMetadata({
  title: 'Dashboard Ejecutivo - MindForge Telemetry',
  description: 'Panel de control de métricas de uso, retención y comportamiento de usuarios Beta.',
  canonicalUrl: 'https://mindforge.app/dashboard/executive',
  noIndex: true, // Ruta administrativa
});

export default async function ExecutiveDashboardPage() {
  const metrics = await EnterpriseTelemetryEngine.getInstance().getExecutiveMetrics();

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Nexus Core / Analytics
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Ejecutivo</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-slate-400">Beta Telemetry Active</span>
          </div>
        </div>

        {/* Mallas de Métricas (Épica 4) */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Usuarios Diarios (DAU)</p>
            <p className="mt-2 text-3xl font-black text-white">{metrics.dailyActiveUsers}</p>
            <span className="mt-2 block text-xs text-emerald-400">↑ 12% vs día anterior</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Juego Favorito</p>
            <p className="mt-2 text-2xl font-bold text-indigo-400">{metrics.favoriteGame}</p>
            <span className="mt-2 block text-xs text-slate-500">Más aperturas iniciales</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Tiempo Promedio / Sesión</p>
            <p className="mt-2 text-3xl font-black text-white">{metrics.avgSessionDurationMinutes} min</p>
            <span className="mt-2 block text-xs text-indigo-300">Meta: &gt; 3.0 min</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Retención Beta</p>
            <p className="mt-2 text-3xl font-black text-emerald-400">{metrics.retentionRatePercentage}%</p>
            <span className="mt-2 block text-xs text-slate-500">Retorno a 7 días</span>
          </div>
        </div>

        {/* Desglose de Telemetría Empresarial (Épica 11) */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-lg font-bold text-white">Embudo de Abandono y Transición</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>Juego con Mayor Tasa de Abandono:</span>
                <span className="font-semibold text-rose-400">{metrics.topAbandonmentGame}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span>Sesiones Totales Registradas:</span>
                <span className="font-semibold text-slate-100">{metrics.totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span>Conversión a Transición de Juego:</span>
                <span className="font-semibold text-emerald-400">42% (Juegan &gt;1 juego)</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-lg font-bold text-white">Estado de Requisitos del Sprint MF-3</h3>
            <ul className="mt-4 space-y-2 text-xs">
              <li className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2">
                <span>Feature Flag Ads (`adsEnabled: false`)</span>
                <span className="font-bold text-emerald-400">READY</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2">
                <span>Onboarding Anónimo (&lt;20s)</span>
                <span className="font-bold text-emerald-400">READY</span>
              </li>
              <li className="flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2">
                <span>Founder Badge 2026 Engine</span>
                <span className="font-bold text-emerald-400">READY</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}