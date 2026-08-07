import Link from 'next/link';
import { generateMetadata } from '@nexus-core/growth';

export const metadata = generateMetadata({
  title: 'MindForge - Entrenamiento Cerebral de Alta Sensibilidad',
  description: 'Prueba la Beta de MindForge. Juegos cognitivos ágiles diseñados para métricas reales de rendimiento.',
  canonicalUrl: 'https://mindforge.app',
});

export default function MarketingLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* PANTALLA 1: Hero & Propuesta de Valor */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0,transparent_70%)] pointer-events-none" />
        
        <span className="mb-4 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
          Founder Beta Launch 2026
        </span>

        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Entrena tu agilidad mental en <span className="text-indigo-500">menos de 20 segundos</span>
        </h1>

        <p className="mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
          Sin registros largos ni formularios. MindForge mide tu enfoque, velocidad de reacción y memoria de trabajo mediante partidas cortas.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/games"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
          >
            Comenzar a Jugar Ahora
          </Link>
        </div>
      </section>

      {/* PANTALLA 2: Catálogo de Juegos Beta & Beneficios */}
      <section className="border-t border-slate-800/80 bg-slate-900/50 py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">¿Por qué probar MindForge?</h2>
            <p className="mt-2 text-slate-400">Tres pilares diseñados para el rendimiento cognitivo diario.</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-3 text-2xl">⚡</div>
              <h3 className="font-semibold text-white">Sin Fricción</h3>
              <p className="mt-2 text-xs text-slate-400">Sin contraseñas. Abre la app, elige tu reto y juega directamente.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-3 text-2xl">🧠</div>
              <h3 className="font-semibold text-white">Métricas Precisas</h3>
              <p className="mt-2 text-xs text-slate-400">Monitorea tus tiempos de respuesta, precisión y velocidad de procesamiento.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-3 text-2xl">🎖️</div>
              <h3 className="font-semibold text-white">Founder Badge 2026</h3>
              <p className="mt-2 text-xs text-slate-400">Obtén acceso exclusivo y la distinción de usuario pionero sin costo.</p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/games"
              className="inline-block rounded-xl border border-indigo-500/50 px-6 py-3 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/10"
            >
              Explorar Catálogo de Juegos →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}