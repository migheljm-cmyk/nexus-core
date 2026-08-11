// apps/main-app/src/components/modules/EvidenceTimeline.tsx
"use client";

import React from "react";

export interface EvidenceArtifact {
  id: string;
  artifactName: string;
  artifactType: string;
  payloadHashSha256: string;
  isSealed: boolean;
  createdAt: string;
}

interface EvidenceTimelineProps {
  artifacts: EvidenceArtifact[];
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ artifacts }) => {
  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Trazabilidad Forense de Evidencia
      </h3>

      <div className="relative border-l border-slate-700 ml-4 space-y-6 pl-6 py-2">
        {artifacts.map((item) => (
          <div key={item.id} className="relative group">
            {/* Indicador de nodo */}
            <div
              className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                item.isSealed
                  ? "bg-slate-900 border-emerald-400"
                  : "bg-slate-900 border-amber-500"
              }`}
            />

            {/* Tarjeta de evento */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-md p-4 backdrop-blur-sm space-y-2 hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    {item.artifactType}
                  </span>
                  <h4 className="text-sm font-medium text-slate-200">
                    {item.artifactName}
                  </h4>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Hash Cryptográfico */}
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800 font-mono text-xs flex items-center justify-between text-slate-300">
                <span className="truncate mr-2">
                  <strong className="text-slate-500">SHA-256:</strong> {item.payloadHashSha256}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase ${
                    item.isSealed
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-amber-950 text-amber-300 border border-amber-800"
                  }`}
                >
                  {item.isSealed ? "Sellado" : "Pendiente"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};