'use client';

import React from 'react';
import { useOsintAnalysis } from '../../hooks/useOsintAnalysis';
import { OsintForm } from '../../components/osint/OsintForm';
import { RiskMatrix } from '../../components/osint/RiskMatrix';
import { ExecutiveSummaryCard } from '../../components/osint/ExecutiveSummaryCard';
import { EvidenceTimeline } from '../../components/osint/EvidenceTimeline';
import OsintReportView from './components/OsintReportView';

export default function OsintDashboardPage() {
  const {
    isAnalyzing,
    isDownloadingPdf,
    error,
    data,
    runAnalysis,
    downloadPdfReport,
  } = useOsintAnalysis();

  return (
    <main className="min-h-screen bg-slate-950 text-emerald-400 p-6 font-mono">
      {/* HEADER DE CONSOLA CYBER-FORENSICS */}
      <header className="mb-8 border-b border-emerald-500/30 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="inline-block w-3 h-3 bg-emerald-500 animate-pulse rounded-full" />
              NEXUS CORE :: OSINT & DUE DILIGENCE B2B
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              [SYSTEM: ACTIVE] // ENGINE: ACID-CYBER-FORENSICS V2.4 + PROACTIVE ENRICHMENT
            </p>
          </div>
          {isAnalyzing && (
            <div className="text-xs bg-amber-500/10 border border-amber-500/40 text-amber-400 px-3 py-1.5 rounded animate-pulse">
              EJECUTANDO INGESTA Y PARSING OSINT...
            </div>
          )}
        </div>
      </header>

      {/* ERROR FEEDBACK */}
      {error && (
        <div className="mb-6 bg-red-950/50 border border-red-500/50 text-red-400 p-4 rounded text-sm">
          [ERROR DE SISTEMA]: {error}
        </div>
      )}

      {/* GRID DE COMPONENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL IZQUIERDO: FORMULARIO DE INGESTIÓN */}
        <div className="lg:col-span-4 space-y-6">
          <OsintForm onAnalyze={runAnalysis} isLoading={isAnalyzing} />
        </div>

        {/* PANEL DERECHO: RESULTADOS Y VISUALIZADORES */}
        <div className="lg:col-span-8 space-y-6">
          {data ? (
            <>
              {/* TARJETA DE DICTAMEN EJECUTIVO CON SELLO SHA-256 Y BOTÓN PDF */}
              <ExecutiveSummaryCard 
                caseId={data.caseId}
                hashSha256={data.hashSha256}
                summary={data.summary}
                isDownloadingPdf={isDownloadingPdf}
                onDownloadPdf={downloadPdfReport}
              />

              {/* MÓDULOS DE ENRIQUECIMIENTO EN TIEMPO REAL (Domain Risk, SAT 69-B, OpenSanctions) */}
              {data.modules && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4">
                  <OsintReportView report={data} />
                </div>
              )}

              {/* MATRIZ DE RIESGO & LÍNEA DE TIEMPO / EVIDENCIAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RiskMatrix
                  risks={(data.riskMatrix || []).map((point: any, index: number) => ({
                    id: point.id || `risk-${index}`,
                    title: point.title || point.label || `Riesgo ${index + 1}`,
                    category: point.category || 'OSINT',
                    severity: point.severity || 'MEDIUM',
                    description: point.description || '',
                    ...point,
                  })) as any}
                />
                <EvidenceTimeline 
                  evidences={(data.evidences || data.timeline || []) as any} 
                />
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-900/40 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <svg
                className="w-12 h-12 mb-3 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm">
                No hay análisis activo. Ingrese los datos de la entidad en el panel izquierdo para iniciar la ingesta OSINT.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}