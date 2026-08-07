'use client';

import React, { useEffect } from 'react';
import { trackEvent, GameId } from '../../lib/telemetry/events';

interface AdSlotProps {
  slotId: string;
  format?: 'leaderboard' | 'rectangle' | 'banner';
  gameId: GameId;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slotId,
  format = 'leaderboard',
  gameId,
}) => {
  // Registrar Impresión al cargar el banner
  useEffect(() => {
    trackEvent(gameId, 'ad_impression', {
      slotId,
      format,
    });
  }, [slotId, gameId, format]);

  // Manejador de Clic en la Publicidad
  const handleAdClick = () => {
    trackEvent(gameId, 'ad_click', {
      slotId,
      format,
    });
  };

  // Dimensiones según formato
  const formatClasses = {
    leaderboard: 'w-full h-24 max-w-4xl',
    rectangle: 'w-72 h-60',
    banner: 'w-full h-16 max-w-2xl',
  };

  return (
    <div
      onClick={handleAdClick}
      className={`mx-auto bg-slate-900/60 border border-dashed border-slate-700/80 rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-purple-500/50 transition-colors group relative overflow-hidden ${formatClasses[format]}`}
    >
      <div className="absolute top-2 right-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
        Publicidad
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-slate-400 group-hover:text-purple-300 transition-colors">
          Espacio Patrocinado — {slotId}
        </p>
        <p className="text-[11px] text-slate-500">
          Ubicación: <span className="text-slate-400 capitalize">{gameId}</span> ({format})
        </p>
      </div>
    </div>
  );
};