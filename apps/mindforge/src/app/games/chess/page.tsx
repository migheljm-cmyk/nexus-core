'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@nexus/ui';
import { mindforgeConfig } from '../../../mindforge.config';
import { ChessBoardComponent } from '../../../components/games/ChessBoard';
import { AdSlot } from '../../../components/ads/AdSlot';
import GameGuard from '../../../components/auth/GameGuard';

export default function ChessPage() {
  const isEnabled = mindforgeConfig.featureFlags.chessEnabled;

  if (!isEnabled) {
    return (
      <main className="p-8 max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold text-white">Módulo No Disponible</h1>
        <p className="text-slate-400">
          El módulo de Ajedrez está desactivado en los Feature Flags.
        </p>
        <Link href="/">
          <Button variant="outline">Volver al Hub de Juegos</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Ajedrez — MindForge</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Powered by{' '}
            <span className="text-purple-400 font-semibold">
              {mindforgeConfig.ai?.defaultProvider || 'gemini'}
            </span>
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">← Volver al Portal</Button>
        </Link>
      </div>

      {/* AQUÍ VA EL ÚNICO BANNER PUBLICITARIO */}
      <AdSlot slotId="chess-top-banner" format="leaderboard" gameId="chess" />

      {/* Componente del Juego Protegido/Monitoreado por GameGuard */}
      <GameGuard gameTitle="Ajedrez">
        <ChessBoardComponent />
      </GameGuard>
    </main>
  );
}