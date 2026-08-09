'use client';

import React, { useState } from 'react';

interface ModuleFlagsProps {
  title: string;
  badgeText: string;
  badgeColor: string;
  flags: string[];
  details?: Record<string, any>;
}

function ModuleCard({ title, badgeText, badgeColor, flags, details }: ModuleFlagsProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 mb-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-md font-semibold text-slate-100">{title}</h4>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
          {badgeText}
        </span>
      </div>

      {flags && flags.length > 0 ? (
        <ul className="space-y-2 mb-3">
          {flags.map((flag, idx) => (
            <li key={idx} className="text-xs text-amber-300 flex items-start gap-2">
              <span className="text-amber-500 font-bold">▪</span>
              <span>{flag}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-emerald-400 mb-3">
          ✓ No se detectaron anomalías o alertas críticas en este módulo.
        </p>
      )}

      {details && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          {Object.entries(details).map(([key, val]) => (
            <div key={key} className="bg-slate-950/50 p-2 rounded">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">{key}</span>
              <span className="text-slate-200 font-mono font-medium truncate block">
                {typeof val === 'boolean' ? (val ? 'SÍ' : 'NO') : String(val ?? 'N/A')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OsintReportView({ report }: { report: any }) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const { summary, evidences, modules, hashSha256, caseId, reportId } = report;
  const isHighRisk = summary?.riskScore > 50;

  const handleCopyHash = () => {
    if (hashSha256) {
      navigator.clipboard.writeText(hashSha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100 font-sans">
      {/* Header del Reporte */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              {caseId || 'CASE-ID'}
            </span>
            <span className="text-xs font-mono text-slate-500">| {reportId}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{summary?.targetName}</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">RFC/TaxID: {summary?.targetTaxId}</p>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">ÍNDICE DE RIESGO</span>
            <span className={`text-3xl font-extrabold font-mono ${isHighRisk ? 'text-red-500' : 'text-emerald-400'}`}>
              {summary?.riskScore}/100
            </span>
          </div>
          <div className={`px-4 py-2 rounded-lg text-xs font-bold font-mono border ${
            isHighRisk 
              ? 'bg-red-950/40 text-red-400 border-red-800' 
              : 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
          }`}>
            {summary?.overallRisk} RISK
          </div>
        </div>
      </div>

      {/* Dictamen Ejecutivo */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold uppercase font-mono text-slate-400 mb-2">Dictamen Pericial OSINT</h3>
        <p className="text-sm text-slate-200 leading-relaxed">{summary?.verdict}</p>
      </div>

      {/* Grid de Módulos de Enriquecimiento */}
      {modules && (
        <div>
          <h3 className="text-md font-bold text-slate-200 mb-3 font-mono">MÓDULOS DE ENRIQUECIMIENTO EN TIEMPO REAL</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Domain Risk */}
            <ModuleCard
              title="Domain Risk & TLD"
              badgeText={modules.domainRisk?.riskLevel || 'N/A'}
              badgeColor="bg-sky-950 text-sky-400 border-sky-800"
              flags={modules.domainRisk?.flags || []}
              details={modules.domainRisk?.details ? {
                TLD: modules.domainRisk.details.tld,
                Antigüedad: modules.domainRisk.details.domainAgeDays ? `${modules.domainRisk.details.domainAgeDays} días` : 'No verificada',
                SPF: modules.domainRisk.details.dnsRecords?.hasSpf,
                DMARC: modules.domainRisk.details.dnsRecords?.hasDmarc
              } : undefined}
            />

            {/* SAT 69-B */}
            <ModuleCard
              title="SAT 69-B / Registros MX"
              badgeText={modules.satCheck?.satList69B?.status || 'SIN DATOS'}
              badgeColor={modules.satCheck?.satList69B?.isListed ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}
              flags={modules.satCheck?.flags || []}
              details={modules.satCheck ? {
                RFC: modules.satCheck.rfc,
                Tipo: modules.satCheck.taxpayerType,
                Listado69B: modules.satCheck.satList69B?.isListed,
                SIGER: modules.satCheck.sigerTradeRegister?.status
              } : undefined}
            />

            {/* OpenSanctions & GeoIP */}
            <ModuleCard
              title="Sanciones Globales & GeoIP"
              badgeText={modules.openSanctions?.hasSanctionsMatch ? 'ALERTA SANCION' : 'CLEAN'}
              badgeColor={modules.openSanctions?.hasSanctionsMatch ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'}
              flags={modules.openSanctions?.flags || []}
              details={modules.openSanctions?.geoIpAnalysis ? {
                HostingIP: modules.openSanctions.geoIpAnalysis.ip,
                PaísServidor: modules.openSanctions.geoIpAnalysis.hostingCountry,
                PaísDeclarado: modules.openSanctions.geoIpAnalysis.declaredCountry,
                Discrepancia: modules.openSanctions.geoIpAnalysis.isMismatch
              } : undefined}
            />
          </div>
        </div>
      )}

      {/* Bitácora de Evidencias */}
      {evidences && evidences.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold uppercase font-mono text-slate-400 mb-4">Evidencias Recolectadas ({evidences.length})</h3>
          <div className="space-y-3">
            {evidences.map((ev: any) => (
              <div key={ev.id} className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{ev.id}</span>
                    <span className="text-xs font-semibold text-slate-200">{ev.source}</span>
                  </div>
                  <p className="text-xs text-slate-400">{ev.description}</p>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  ev.status === 'VERIFIED' 
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' 
                    : ev.status === 'CRITICAL' 
                    ? 'bg-red-950/60 text-red-400 border-red-800'
                    : 'bg-amber-950/60 text-amber-400 border-amber-800'
                }`}>
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trazabilidad y Sello Criptográfico SHA-256 */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 overflow-hidden w-full md:w-auto">
          <span className="text-slate-500 font-bold shrink-0">SHA-256:</span>
          <span className="text-slate-300 truncate">{hashSha256 || 'N/A'}</span>
        </div>
        <button
          onClick={handleCopyHash}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded transition shrink-0 font-sans text-xs"
        >
          {copied ? '✓ Copiado' : 'Copiar Firma'}
        </button>
      </div>
    </div>
  );
}