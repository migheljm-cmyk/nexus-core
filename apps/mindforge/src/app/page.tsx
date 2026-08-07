'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card } from '@nexus/ui';
import { mindforgeConfig } from '../mindforge.config';
import { useGuestSession } from '../hooks/useGuestSession';

export default function MindForgeHubPage() {
  const { profile, guestId } = useGuestSession();

  const games = [
    {
      id: 'chess',
      title: 'Ajedrez',
      category: 'Estrategia',
      description: 'Partidas contra la IA de Nexus o multijugador local con análisis táctico.',
      href: '/games/chess',
      enabled: mindforgeConfig.featureFlags.chessEnabled,
    },
    {
      id: 'sudoku',
      title: 'Sudoku',
      category: 'Lógica',
      description: 'Desafíos matemáticos y de lógica con generador de niveles dinámico.',
      href: '/games/sudoku',
      enabled: mindforgeConfig.featureFlags.sudokuEnabled,
    },
    {
      id: 'peg',
      title: 'Peg Solitaire',
      category: 'Clásico',
      description: 'El clásico juego de mesa y estrategia para despejar el tablero.',
      href: '/games/peg',
      enabled: mindforgeConfig.featureFlags.pegEnabled,
    },
  ];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            MindForge Entertainment
          </h1>
          <p className="text-slate-400 mt-1">Ecosistema de Juegos de Estrategia MENTAL</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Badge de Sesión Guest */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-500 block font-mono">SESIÓN ACTIVA</span>
            <span className="text-purple-400 font-bold font-mono">
              {guestId ? guestId.slice(0, 16) + '...' : 'Cargando...'}
            </span>
          </div>

          <Link href="/dashboard">
            <Button variant="outline">Ir al Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Resumen de Estadísticas Rápidas del Jugador */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Partidas Ajedrez</p>
              <p className="text-xl font-bold text-white">{profile.stats.chess.gamesPlayed}</p>
            </div>
            <span className="text-xs text-purple-400 font-mono">
              {profile.stats.chess.gamesWon} Victorias
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Partidas Sudoku</p>
              <p className="text-xl font-bold text-white">{profile.stats.sudoku.gamesPlayed}</p>
            </div>
            <span className="text-xs text-purple-400 font-mono">
              {profile.stats.sudoku.gamesWon} Victorias
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Partidas Peg</p>
              <p className="text-xl font-bold text-white">{profile.stats.peg.gamesPlayed}</p>
            </div>
            <span className="text-xs text-purple-400 font-mono">
              {profile.stats.peg.gamesWon} Victorias
            </span>
          </div>
        </div>
      )}

      {/* Catálogo Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Catálogo de Juegos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card
              key={game.id}
              className="p-6 bg-slate-900 border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">
                    {game.category}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      game.enabled
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {game.enabled ? 'Disponible' : 'Próximamente'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{game.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{game.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                {game.enabled ? (
                  <Link href={game.href} className="w-full block">
                    <Button variant="primary" className="w-full">
                      Jugar Ahora
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" className="w-full cursor-not-allowed opacity-50" disabled>
                    Bloqueado
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}