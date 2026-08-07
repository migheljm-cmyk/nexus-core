'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@nexus/ui';
import { GrowthAnalytics, GuestProfileManager } from '@mindforge/growth';

type TimeControlOption = 180 | 300 | 600 | 0; // en segundos (3 min, 5 min, 10 min, Sin Tiempo)

const INITIAL_BOARD = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const SOLUTION_BOARD = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function SudokuBoardComponent() {
  const [guestId, setGuestId] = useState<string>('guest_demo_123');
  const [board, setBoard] = useState<number[][]>(INITIAL_BOARD);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [tutorMessage, setTutorMessage] = useState<string>('¡Bienvenido! Usa las flechas o haz clic para desplazarte e ingresar números.');
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);

  // Control de Tiempo
  const [timeLimit, setTimeLimit] = useState<TimeControlOption>(300);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isTimeOver, setIsTimeOver] = useState<boolean>(false);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Inicialización de perfil del invitado
  useEffect(() => {
    const profile = GuestProfileManager.getOrCreateProfile();
    if (profile?.guest_id) {
      setGuestId(profile.guest_id);
    }
  }, []);

  // Evento de inicio de juego en telemetría
  useEffect(() => {
    GrowthAnalytics.getInstance().track(guestId, 'GAME', 'game_open', {
      gameId: 'sudoku',
      timeLimit,
    });
  }, [guestId, timeLimit]);

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
            gameId: 'sudoku',
            timeLimit,
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLimit, isTimeOver, gameCompleted, timeLeft, guestId]);

  const checkGameCompletion = useCallback((currentBoard: number[][]) => {
    let complete = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] !== SOLUTION_BOARD[r][c]) {
          complete = false;
          break;
        }
      }
    }
    if (complete) {
      setGameCompleted(true);
      setIsTimerRunning(false);
      setTutorMessage('🎉 ¡Felicidades! Has completado el Sudoku correctamente.');

      GrowthAnalytics.getInstance().track(guestId, 'GAME', 'game_complete', {
        gameId: 'sudoku',
        timeLimit,
        timeLeft,
      });

      GuestProfileManager.updateProfile({ wins: 1 });
    }
  }, [guestId, timeLimit, timeLeft]);

  const handleCellChange = useCallback((row: number, col: number, val: number) => {
    if (INITIAL_BOARD[row][col] !== 0 || isTimeOver || gameCompleted) return;

    if (!isTimerRunning && timeLimit > 0) {
      setIsTimerRunning(true);
      GrowthAnalytics.getInstance().track(guestId, 'GAME', 'game_start', {
        gameId: 'sudoku',
        timeLimit,
      });
    }

    const newBoard = board.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? val : c))
    );

    setBoard(newBoard);

    const isCorrect = val === SOLUTION_BOARD[row][col];

    if (val !== 0) {
      setTutorMessage(`Casilla [${row + 1}, ${col + 1}] actualizada a ${val}.`);
      GrowthAnalytics.getInstance().track(guestId, 'GAME', 'move', {
        gameId: 'sudoku',
        row,
        col,
        val,
        isCorrect,
      });
    } else {
      setTutorMessage(`Casilla [${row + 1}, ${col + 1}] limpiada.`);
      GrowthAnalytics.getInstance().track(guestId, 'GAME', 'move', {
        gameId: 'sudoku',
        row,
        col,
        action: 'clear',
      });
    }

    checkGameCompletion(newBoard);
  }, [board, isTimeOver, gameCompleted, isTimerRunning, timeLimit, guestId, checkGameCompletion]);

  // Manejo de entrada y navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTimeOver || gameCompleted) return;

      if (!selectedCell) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          setSelectedCell([0, 0]);
        }
        return;
      }

      const [row, col] = selectedCell;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCell([Math.max(0, row - 1), col]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCell([Math.min(8, row + 1), col]);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedCell([row, Math.max(0, col - 1)]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedCell([row, Math.min(8, col + 1)]);
      } else if (e.key >= '1' && e.key <= '9') {
        handleCellChange(row, col, parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleCellChange(row, col, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isTimeOver, gameCompleted, handleCellChange]);

  const handleNumberClick = (num: number) => {
    if (!selectedCell) {
      setTutorMessage('Selecciona primero una casilla en el tablero.');
      return;
    }
    const [row, col] = selectedCell;
    handleCellChange(row, col, num);
  };

  const resetBoard = useCallback((newTimeLimit: TimeControlOption = timeLimit) => {
    setBoard(INITIAL_BOARD);
    setSelectedCell([0, 0]);
    setGameCompleted(false);
    setIsTimeOver(false);
    setTimeLimit(newTimeLimit);
    setTimeLeft(newTimeLimit);
    setIsTimerRunning(false);
    setTutorMessage('Tablero reiniciado. ¡Buena suerte!');

    GrowthAnalytics.getInstance().track(guestId, 'GAME', 'reset', {
      gameId: 'sudoku',
      timeLimit: newTimeLimit,
    });
  }, [timeLimit, guestId]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Panel Unificado de Controles */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4">
        {/* Control de Tiempo */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Control Tiempo:</span>
          {[
            { label: '3 min', val: 180 },
            { label: '5 min', val: 300 },
            { label: '10 min', val: 600 },
            { label: '∞ Libre', val: 0 },
          ].map((t) => (
            <button
              key={t.val}
              onClick={() => resetBoard(t.val as TimeControlOption)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                timeLimit === t.val
                  ? 'bg-amber-600 text-white border-amber-500'
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
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
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
                  gameId: 'sudoku',
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

      {/* Tablero y Controles Laterales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[520px]">
          <div className="grid grid-cols-9 gap-1 bg-slate-800 p-2 rounded-lg border-2 border-slate-700 shadow-2xl">
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
                const isOriginal = INITIAL_BOARD[rIdx][cIdx] !== 0;
                const isSelected =
                  selectedCell && selectedCell[0] === rIdx && selectedCell[1] === cIdx;
                const isSameGroup =
                  selectedCell &&
                  (selectedCell[0] === rIdx ||
                    selectedCell[1] === cIdx ||
                    (Math.floor(selectedCell[0] / 3) === Math.floor(rIdx / 3) &&
                      Math.floor(selectedCell[1] / 3) === Math.floor(cIdx / 3)));

                const borderClasses = `
                  ${cIdx % 3 === 2 && cIdx !== 8 ? 'mr-1 border-r-2 border-slate-600' : ''}
                  ${rIdx % 3 === 2 && rIdx !== 8 ? 'mb-1 border-b-2 border-slate-600' : ''}
                `;

                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => setSelectedCell([rIdx, cIdx])}
                    disabled={isTimeOver || gameCompleted}
                    className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg font-bold rounded transition-colors ${borderClasses} ${
                      isOriginal
                        ? 'bg-slate-950 text-slate-400 font-extrabold cursor-not-allowed'
                        : cell !== 0
                        ? 'bg-slate-800 text-purple-400 font-semibold'
                        : isSameGroup
                        ? 'bg-slate-800/60 text-slate-100'
                        : 'bg-slate-900 text-slate-100 hover:bg-slate-800'
                    } ${isSelected ? 'ring-2 ring-purple-500 bg-purple-950/60' : ''}`}
                  >
                    {cell !== 0 ? cell : ''}
                  </button>
                );
              })
            )}
          </div>

          {/* Teclado Numérico Táctil */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-[480px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={isTimeOver || gameCompleted}
                className="w-10 h-10 rounded bg-slate-800 hover:bg-purple-600 text-white font-bold transition-colors border border-slate-700 disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleNumberClick(0)}
              disabled={isTimeOver || gameCompleted}
              className="px-3 h-10 rounded bg-rose-950/80 hover:bg-rose-800 text-rose-300 font-bold transition-colors border border-rose-800 text-xs disabled:opacity-50"
            >
              Borrar
            </button>
          </div>
        </div>

        {/* Panel Lateral de Instrucciones */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Instrucciones</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Muévete por el tablero con las <strong>flechas del teclado</strong> (o haciendo clic) e introduce números del 1 al 9.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside border-t border-slate-800 pt-4">
              <li>Usa <strong>flechas (↑, ↓, ←, →)</strong> para desplazarte.</li>
              <li>Los números originales no se pueden modificar.</li>
              <li>Puedes pausar o ajustar el tiempo en el panel superior.</li>
              <li>Completa toda la cuadrícula sin repetir números en filas, columnas ni bloques de 3x3.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}