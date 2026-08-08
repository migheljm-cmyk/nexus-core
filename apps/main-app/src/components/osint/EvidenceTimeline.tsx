// apps/main-app/src/components/osint/EvidenceTimeline.tsx
'use client';

import React from 'react';
import {
  Clock,
  Building2,
  Globe,
  FileCheck,
  Mail,
  MapPin,
  HelpCircle,
} from 'lucide-react';

export interface EvidenceItem {
  id: string;
  timestamp: string;
  source: string;
  type: 'CORPORATE' | 'DOMAIN' | 'TAX' | 'COMMUNICATION' | 'GEOLOCATION';
  status: 'VERIFIED' | 'SUSPICIOUS' | 'UNVERIFIED';
  detail: string;
}

export interface EvidenceTimelineProps {
  evidences: EvidenceItem[];
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
  evidences,
}: EvidenceTimelineProps) => {
  const getTypeIcon = (type: EvidenceItem['type']) => {
    switch (type) {
      case 'CORPORATE':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'DOMAIN':
        return <Globe className="w-3.5 h-3.5" />;
      case 'TAX':
        return <FileCheck className="w-3.5 h-3.5" />;
      case 'COMMUNICATION':
        return <Mail className="w-3.5 h-3.5" />;
      case 'GEOLOCATION':
        return <MapPin className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-6 shadow-xl font-mono">
      <div className="mb-6 pb-3 border-b border-[#30363D]">
        <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#22C55E]" />
          LÍNEA DE TIEMPO & EVIDENCIAS
        </h3>
        <p className="text-xs text-gray-400">
          // Trazabilidad cronológica de recolección de hallazgos
        </p>
      </div>

      <div className="relative border-l border-[#30363D] ml-3.5 space-y-6">
        {evidences.map((item: EvidenceItem) => {
          const isSuspicious = item.status === 'SUSPICIOUS';
          const isVerified = item.status === 'VERIFIED';

          return (
            <div key={item.id} className="relative pl-6 group">
              {/* Node Indicator Dot */}
              <span
                className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full ring-4 ring-[#161B22] transition-colors ${
                  isSuspicious
                    ? 'bg-red-500 shadow-sm shadow-red-500/50'
                    : isVerified
                    ? 'bg-[#22C55E] shadow-sm shadow-emerald-500/50'
                    : 'bg-gray-500'
                }`}
              />

              <div className="bg-[#0D1117] border border-[#30363D] hover:border-gray-600 rounded-lg p-3.5 transition-colors shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500 tracking-wider">
                    {item.timestamp}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest border ${
                      isSuspicious
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : isVerified
                        ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30'
                        : 'bg-gray-800/50 text-gray-400 border-gray-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="text-xs font-bold text-gray-200 mb-1 flex items-center gap-2">
                  <span className="p-1 rounded bg-[#161B22] border border-[#30363D] text-[#22C55E]">
                    {getTypeIcon(item.type)}
                  </span>
                  <span className="text-[#22C55E]">[{item.type}]</span>
                  <span className="text-gray-400 font-normal">|</span>
                  <span className="text-gray-300">{item.source}</span>
                </div>

                <p className="text-xs font-sans text-gray-400 leading-normal pl-7">
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};