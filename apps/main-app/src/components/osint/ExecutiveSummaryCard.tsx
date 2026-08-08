import React from 'react';
import { ExecutiveSummary } from './OsintPdfReport';

interface ExecutiveSummaryCardProps {
  caseId: string;
  hashSha256: string;
  summary: ExecutiveSummary;
  isDownloadingPdf?: boolean;
  onDownloadPdf?: () => void;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  caseId,
  hashSha256,
  summary,
  isDownloadingPdf = false,
  onDownloadPdf,
}) => {
  const getRiskBadgeColor = (risk: ExecutiveSummary['overallRisk']) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-800/60';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/60';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800/60';
      case 'LOW':
      default:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
    }
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-6 font-mono text-slate-100 shadow-xl relative overflow-hidden">
      {/* Glow de acento Cyber-Forensics */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <div className="text-xs text-emerald-400 tracking-widest uppercase mb-1">
            Dictamen Forense B2B // {caseId}
          </div>
          <h2 className="text-xl font-bold text-slate-50 tracking-tight">
            {summary.targetName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            TAX ID / REG: <span className="text-slate-200">{summary.targetTaxId}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold border rounded uppercase tracking-wider ${getRiskBadgeColor(
              summary.overallRisk
            )}`}
          >
            Riesgo: {summary.overallRisk}
          </span>

          {/* Botón de Exportación Criptográfica */}
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingPdf ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar PDF (.SHA256)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Métricas de Score */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Risk Score</span>
          <span className="text-lg font-bold text-emerald-400">{summary.riskScore} / 100</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Global Score</span>
          <span className="text-lg font-bold text-slate-200">{summary.globalScore} / 100</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Flags Críticos</span>
          <span className="text-lg font-bold text-red-400">{summary.flagsCount.critical}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Ingesta UTC</span>
          <span className="text-xs text-slate-300 block truncate mt-1">{summary.analyzedAt}</span>
        </div>
      </div>

      {/* Verdict & Key Findings */}
      <div className="space-y-4 mb-6">
        <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded">
          <h3 className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Veredicto Forense</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{summary.verdict}</p>
        </div>

        <div>
          <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Hallazgos Clave</h3>
          <ul className="space-y-1.5">
            {summary.keyFindings.map((finding, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 select-none">&gt;</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sello de integridad visible en UI */}
      <div className="border-t border-slate-900 pt-3 flex flex-col md:flex-row justify-between items-start md:items-center text-[10px] text-slate-500 gap-2">
        <div>
          SHA-256 PROOF: <span className="font-mono text-slate-400">{hashSha256}</span>
        </div>
        <div className="text-emerald-500/80 uppercase tracking-widest">
          Nexus Core Cripto-Validated
        </div>
      </div>
    </div>
  );
};