'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@nexus/ui';
import { GrowthAnalytics, GuestProfileManager } from '@mindforge/growth';
import { saveGameState, loadGameState, clearGameState, checkAndUpdateStreak } from '../../lib/storage/gameStorage';

type TimeControlOption = 180 | 300 | 600 | 0; // 3 min, 5 min, 10 min, 0 = Modo Zen / Libre

const INITIAL_PEG_BOARD = [
  [-1, -1,  1,  1,  1, -1, -1],
  [-1, -1,  1,  1,  1, -1, -1],
  [ 1,  1,  1,  1,  1,  1,  1],
  [ 1,  1,  1,  0,  1,  1,  1],
  [ 1,  1,  1,  1,  1,  1,  1],
  [-1, -1,  1,  1,  1, -1, -1],
  [-1, -1,  1,  1,  1, -1, -1],
];

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function PegSolitaireBoardComponent() {
  const [guestId, setGuestId] = useState<string>('guest_demo_123');
  const [board, setBoard] = useState<number[][]>(INITIAL_PEG_BOARD);
  const [selectedPeg, setSelectedPeg] = useState<[number, number] | null>(null);
  const [pegsCount, setPegsCount] = useState<number>(32);
  const [streakInfo, setStreakInfo] = useState<number>(1);
  const [tutorMessage, setTutorMessage] = useState<string>('¡Bienvenido! Selecciona una ficha para iniciar tus movimientos.');
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);

  // Control de Tiempo
  const [timeLimit, setTimeLimit] = useState<TimeControlOption>(300);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isTimeOver, setIsTimeOver] = useState<boolean>(false);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Carga inicial, Racha y Telemetría
  useEffect(() => {
    const profile = GuestProfileManager.getOrCreateProfile();
    if (profile?.guest_id) {
      setGuestId(profile.guest_id);
    }

    const gamification = checkAndUpdateStreak();
    setStreakInfo(gamification.streakCount);

    if (timeLimit === 0) {
      const saved = loadGameState<{ board: number[][]; pegsCount: number }>('peg');
      if (saved && saved.state) {
        setBoard(saved.state.board);
        setPegsCount(saved.state.pegsCount);
        setTutorMessage('Progreso restaurado en Modo Zen.');
      }
    }

    GrowthAnalytics.getInstance().track(profile?.guest_id || guestId, 'GAME', 'game_open', {
      gameId: 'peg_solitaire',
      timeLimit,
    });
  }, []);

  // Reloj de tiempo
  useEffect(() => {
    if (timeLimit === 0 || !isTimerRunning || isTimeOver || gameCompleted || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeOver(true);
          setIsTimerRunning(false);
          setTutorMessage('⏱️ ¡Tiempo agotado! Has alcanzado el límite.');

          GrowthAnalytics.getInstance().track(guestId, 'GAME', 'time_over', {
            gameId: 'peg_solitaire',
            timeLimit,
            pegsRemaining: pegsCount,
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLimit, isTimeOver, gameCompleted, timeLeft, guestId, pegsCount]);

  const handleCellClick = useCallback((row: number, col: number) => {
    const val = board[row][col];
    if (val === -1 || isTimeOver || gameCompleted) return;

    if (!isTimerRunning && timeLimit > 0) {
      setIsTimerRunning(true);
      GrowthAnalytics.getInstance().track(guestId, 'GAME', 'game_start', {
        gameId: 'peg_solitaire',
        timeLimit,
      });
    }

    if (!selectedPeg) {
      if (val === 1) {
        setSelectedPeg([row, col]);
        setTutorMessage(`Ficha seleccionada en [${row + 1}, ${col + 1}]. Elige una casilla vacía válida.`);
      }
      return;
    }

    const [sr, sc] = selectedPeg;
    if (sr === row && sc === col) {
      setSelectedPeg(null);
      setTutorMessage('Selección cancelada.');
      return;
    }

    if (val === 0) {
      const rowDiff = Math.abs(row - sr);
      const colDiff = Math.abs(col - sc);

      if ((rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2)) {
        const midRow = (sr + row) / 2;
        const midCol = (sc + col) / 2;

        if (board[midRow][midCol] === 1) {
          const newBoard = board.map((r, rIdx) =>
            r.map((c, cIdx) => {
              if (rIdx === sr && cIdx === sc) return 0;
              if (rIdx === midRow && cIdx === midCol) return 0;
              if (rIdx === row && cIdx === col) return 1;
              return c;
            })
          );

          const newPegsCount = pegsCount - 1;
          setBoard(newBoard);
          setSelectedPeg(null);
          setPegsCount(newPegsCount);

          if (timeLimit === 0) {
            saveGameState('peg', { board: newBoard, pegsCount: newPegsCount });
          }

          setTutorMessage(`Movimiento realizado. Quedan ${newPegsCount} fichas.`);

          GrowthAnalytics.getInstance().track(guestId, 'GAME', 'move', {
            gameId: 'peg_solitaire',
            from: [sr, sc],
            to: [row, col],
            pegsRemaining: newPegsCount,
            timeLimit,
          });

          if (newPegsCount === 1) {
            setGameCompleted(true);
            setIsTimerRunning(false);
            setTutorMessage('🎉 ¡Increíble! Has resuelto el Peg Solitaire dejando solo 1 ficha.');

            GrowthAnalytics.getInstance().track(guestId, 'GAME', 'game_complete', {
              gameId: 'peg_solitaire',
              result: 'win',
              timeLeft,
              timeLimit,
            });

            GuestProfileManager.updateProfile({ wins: 1 });

            if (timeLimit === 0) clearGameState('peg');
          }
          return;
        }
      }
    }

    if (val === 1) {
      setSelectedPeg([row, col]);
      setTutorMessage(`Cambiado a la ficha en [${row + 1}, ${col + 1}].`);
    } else {
      setSelectedPeg(null);
      setTutorMessage('Movimiento no válido. Debes saltar sobre una ficha hacia un espacio vacío.');
    }
  }, [board, isTimeOver, gameCompleted, isTimerRunning, timeLimit, selectedPeg, pegsCount, guestId, timeLeft]);

  const resetBoard = useCallback((newTimeLimit: TimeControlOption = timeLimit) => {
    setBoard(INITIAL_PEG_BOARD);
    setSelectedPeg(null);
    setPegsCount(32);
    setGameCompleted(false);
    setIsTimeOver(false);
    setTimeLimit(newTimeLimit);
    setTimeLeft(newTimeLimit);
    setIsTimerRunning(false);
    setTutorMessage('Tablero reiniciado. ¡Buena suerte!');
    if (newTimeLimit === 0) clearGameState('peg');

    GrowthAnalytics.getInstance().track(guestId, 'GAME', 'reset', {
      gameId: 'peg_solitaire',
      timeLimit: newTimeLimit,
    });
  }, [timeLimit, guestId]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Panel Unificado de Controles */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4">
        {/* Control de Tiempo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Modo / Tiempo:</span>
          {[
            { label: '☕ Zen (Libre)', val: 0 },
            { label: '3 min', val: 180 },
            { label: '5 min', val: 300 },
            { label: '10 min', val: 600 },
          ].map((t) => (
            <button
              key={t.val}
              onClick={() => resetBoard(t.val as TimeControlOption)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                timeLimit === t.val
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Temporizador y Pausa */}
        <div className="flex items-center gap-3">
          {timeLimit > 0 && (
            <span
              className={`font-mono px-3 py-1.5 rounded font-bold border text-sm ${
                isTimerRunning && !isTimeOver && !gameCompleted
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              ⏱️ {formatTime(timeLeft)}
            </span>
          )}

          {timeLimit > 0 && !isTimeOver && !gameCompleted && (
            <button
              onClick={() => {
                const nextState = !isTimerRunning;
                setIsTimerRunning(nextState);
                GrowthAnalytics.getInstance().track(guestId, 'GAME', nextState ? 'resume' : 'pause', {
                  gameId: 'peg_solitaire',
                  timeLeft,
                });
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                isTimerRunning
                  ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {isTimerRunning ? 'Pausar' : 'Reanudar'}
            </button>
          )}

          <Button variant="outline" onClick={() => resetBoard()}>
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Tutor / Mensajes */}
      <div className="bg-slate-900/80 border border-purple-900/40 px-4 py-2.5 rounded-lg flex items-center gap-3">
        <span className="text-lg">🎓</span>
        <p className="text-xs text-purple-200 font-medium">{tutorMessage}</p>
      </div>

      {/* Tablero y Panel de Información */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        {/* Tablero Cruzado */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[520px]">
          <div className="grid grid-cols-7 gap-2 bg-slate-950 p-6 rounded-2xl border-2 border-slate-800 shadow-2xl">
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                if (cell === -1) {
                  return <div key={`${rIdx}-${cIdx}`} className="w-10 h-10 sm:w-12 sm:h-12" />;
                }

                const isSelected = selectedPeg && selectedPeg[0] === rIdx && selectedPeg[1] === cIdx;

                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    disabled={isTimeOver || gameCompleted}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                      cell === 1
                        ? isSelected
                          ? 'bg-purple-500 ring-4 ring-purple-300 scale-110 shadow-lg shadow-purple-500/50'
                          : 'bg-gradient-to-tr from-purple-700 to-indigo-500 hover:scale-105 border border-purple-400/30'
                        : 'bg-slate-900 border-2 border-dashed border-slate-700 hover:border-purple-500/50'
                    }`}
                  >
                    {cell === 1 && (
                      <div className="w-3 h-3 rounded-full bg-white/40 blur-[1px]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <span className="text-sm font-medium text-slate-400">
              Fichas restantes: <strong className="text-purple-400 text-lg">{pegsCount}</strong>
            </span>
          </div>
        </div>

        {/* Panel Lateral de Estado e Instrucciones */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-xl font-bold text-white">Instrucciones</h2>
              <span className="text-xs bg-purple-950 border border-purple-800 text-purple-300 px-2.5 py-1 rounded-full font-semibold">
                🔥 Racha: {streakInfo} {streakInfo === 1 ? 'día' : 'días'}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              El objetivo es eliminar fichas saltando una sobre otra hacia un espacio vacío contiguo (horizontal o vertical) hasta dejar solo una ficha en el tablero.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside border-t border-slate-800 pt-4">
              <li>El <strong>Modo Zen (Libre)</strong> autoguarda tu progreso para retomarlo después.</li>
              <li>Los modos con temporizador ponen a prueba tu velocidad sin auto-guardado.</li>
              <li>No se permiten saltos diagonales.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}