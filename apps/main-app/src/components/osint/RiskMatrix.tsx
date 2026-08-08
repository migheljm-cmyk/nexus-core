// apps/main-app/src/components/osint/RiskMatrix.tsx
'use client';

import React, { useState } from 'react';
import { ShieldAlert, FilterX, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface RiskItem {
  id: string;
  title: string;
  category: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface RiskMatrixProps {
  risks: RiskItem[];
}

const matrixGrid = [
  { prob: 'HIGH', imp: 'LOW', level: 'MEDIUM', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { prob: 'HIGH', imp: 'MEDIUM', level: 'HIGH', color: 'bg-orange-500/15 border-orange-500/40 text-orange-400' },
  { prob: 'HIGH', imp: 'HIGH', level: 'CRITICAL', color: 'bg-red-500/20 border-red-500/50 text-red-400' },
  { prob: 'MEDIUM', imp: 'LOW', level: 'LOW', color: 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' },
  { prob: 'MEDIUM', imp: 'MEDIUM', level: 'MEDIUM', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  { prob: 'MEDIUM', imp: 'HIGH', level: 'HIGH', color: 'bg-orange-500/15 border-orange-500/40 text-orange-400' },
  { prob: 'LOW', imp: 'LOW', level: 'LOW', color: 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' },
  { prob: 'LOW', imp: 'MEDIUM', level: 'LOW', color: 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' },
  { prob: 'LOW', imp: 'HIGH', level: 'MEDIUM', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
];

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks }: RiskMatrixProps) => {
  const [selectedCell, setSelectedCell] = useState<{ prob: string; imp: string } | null>(null);

  const getRisksForCell = (prob: string, imp: string): RiskItem[] => {
    return risks.filter((r: RiskItem) => r.probability === prob && r.impact === imp);
  };

  const filteredRisks: RiskItem[] = selectedCell
    ? getRisksForCell(selectedCell.prob, selectedCell.imp)
    : risks;

  return (
    <div className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#30363D]">
        <div>
          <h3 className="text-lg font-bold font-mono text-gray-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            MATRIZ VISUAL DE RIESGOS B2B
          </h3>
          <p className="text-xs font-mono text-gray-400">
            // Probabilidad vs. Impacto de hallazgos detectados
          </p>
        </div>
        {selectedCell && (
          <button
            onClick={() => setSelectedCell(null)}
            className="text-xs font-mono text-[#22C55E] hover:underline flex items-center gap-1 bg-[#22C55E]/10 border border-[#22C55E]/30 px-2.5 py-1 rounded-md transition-colors"
          >
            <FilterX className="w-3.5 h-3.5" />
            Limpiar filtro de cuadrante
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6 font-mono">
        <div className="col-span-1 flex items-center justify-center font-bold text-[11px] text-gray-500 uppercase tracking-wider">
          Prob. \ Imp.
        </div>
        <div className="text-center font-bold text-[11px] text-gray-400 uppercase py-1">Bajo</div>
        <div className="text-center font-bold text-[11px] text-gray-400 uppercase py-1">Medio</div>
        <div className="text-center font-bold text-[11px] text-gray-400 uppercase py-1">Alto</div>

        {['HIGH', 'MEDIUM', 'LOW'].map((prob: string) => (
          <React.Fragment key={prob}>
            <div className="flex items-center justify-end pr-2 font-bold text-[11px] text-gray-400 uppercase">
              {prob === 'HIGH' ? 'Alta' : prob === 'MEDIUM' ? 'Media' : 'Baja'}
            </div>
            {['LOW', 'MEDIUM', 'HIGH'].map((imp: string) => {
              const cellDef = matrixGrid.find((g) => g.prob === prob && g.imp === imp)!;
              const count = getRisksForCell(prob, imp).length;
              const isSelected = selectedCell?.prob === prob && selectedCell?.imp === imp;

              return (
                <button
                  key={`${prob}-${imp}`}
                  onClick={() => setSelectedCell({ prob, imp })}
                  className={`h-20 border rounded-lg p-2.5 transition-all flex flex-col justify-between items-start text-left font-mono ${cellDef.color} ${
                    isSelected
                      ? 'ring-2 ring-[#22C55E] border-transparent shadow-lg shadow-emerald-950/40 scale-105 bg-[#0D1117]'
                      : 'hover:border-gray-500 hover:bg-[#0D1117]/80'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">
                    {cellDef.level}
                  </span>
                  <span className="text-xl font-extrabold self-end font-mono">{count}</span>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="border-t border-[#30363D] pt-4 font-mono">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
          <span>Hallazgos {selectedCell ? `en cuadrante (${selectedCell.prob} / ${selectedCell.imp})` : 'totales'}:</span>
          <span className="text-[10px] bg-[#0D1117] border border-[#30363D] text-[#22C55E] px-2 py-0.5 rounded">
            {filteredRisks.length}
          </span>
        </h4>

        {filteredRisks.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-2">No hay riesgos en esta categoría.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredRisks.map((risk: RiskItem) => (
              <div
                key={risk.id}
                className="bg-[#0D1117] border border-[#30363D] hover:border-gray-600 rounded-lg p-3 text-xs flex justify-between items-start transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-100">{risk.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#161B22] border border-[#30363D] text-gray-400 text-[10px] uppercase">
                      {risk.category}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs font-sans">{risk.description}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-3 uppercase border ${
                    risk.severity === 'CRITICAL'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : risk.severity === 'HIGH'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : risk.severity === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                  }`}
                >
                  {risk.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};