'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@nexus/ui';
import { mindforgeConfig } from '../../../mindforge.config';
import SudokuBoardComponent from '../../../components/games/SudokuBoard';
import { AdSlot } from '../../../components/ads/AdSlot';
import GameGuard from '../../../components/auth/GameGuard';

export default function SudokuPage() {
  const isEnabled = mindforgeConfig.featureFlags.sudokuEnabled;

  if (!isEnabled) {
    return (
      <main className="p-8 max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold text-white">Módulo No Disponible</h1>
        <p className="text-slate-400">
          El módulo de Sudoku está desactivado en los Feature Flags.
        </p>
        <Link href="/">
          <Button variant="outline">Volver al Hub de Juegos</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Sudoku — MindForge Logic</h1>
          <p className="text-slate-400 text-sm">
            Generador & Solver asistido por <span className="text-purple-400 font-semibold">{mindforgeConfig.ai?.defaultProvider || 'gemini'}</span>
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">← Volver al Portal</Button>
        </Link>
      </div>

      {/* Banner Publicitario Superior */}
      <AdSlot slotId="sudoku-top-banner" format="leaderboard" gameId="sudoku" />

      {/* Tablero e Interfaz Unificada Protegida por GameGuard */}
      <GameGuard gameTitle="Sudoku">
        <SudokuBoardComponent />
      </GameGuard>
    </main>
  );
}