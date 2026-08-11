// apps/main-app/src/components/modules/OsintPdfReport.tsx
"use client";

import React, { useState } from "react";

interface OsintPdfReportProps {
  investigationId: string;
  targetName: string;
  coiScore: number;
  totalEntities: number;
  vaultHash: string;
}

export const OsintPdfReport: React.FC<OsintPdfReportProps> = ({
  investigationId,
  targetName,
  coiScore,
  totalEntities,
  vaultHash,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportPdf = async () => {
    setIsGenerating(true);
    try {
      // Endpoint que compila y emite el PDF sellado
      const response = await fetch(`/api/v1/investigations/${investigationId}/pdf`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Error en la descarga del reporte PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NEXUS_REPORT_${investigationId.slice(0, 8)}_${targetName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Fallo al exportar reporte PDF:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            Exportación de Informe Legal / OSINT
          </h3>
          <p className="text-xs text-slate-400">
            Genera un documento PDF estructurado con validez pericial y firma digital de cadena de custodia.
          </p>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={isGenerating}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-medium text-xs rounded transition-all shadow-sm flex items-center gap-2"
        >
          {isGenerating ? (
            <span>Compilando PDF...</span>
          ) : (
            <>
              <span>Descargar Reporte Firmado</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded border border-slate-800 font-mono">
        <div>
          <span className="text-slate-500 block">TARGET</span>
          <span className="text-slate-200 font-semibold">{targetName}</span>
        </div>
        <div>
          <span className="text-slate-500 block">COI RISK SCORE</span>
          <span
            className={`font-semibold ${
              coiScore > 70
                ? "text-rose-400"
                : coiScore > 40
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {coiScore} / 100
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">ENTIDADES RASTREADAS</span>
          <span className="text-slate-200 font-semibold">{totalEntities}</span>
        </div>
      </div>
    </div>
  );
};