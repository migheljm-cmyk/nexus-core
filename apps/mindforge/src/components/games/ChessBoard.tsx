'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { saveGameState, clearGameState } from '../../lib/storage/gameStorage';
import { GrowthAnalytics, GuestProfileManager } from '@mindforge/growth';

interface ChessBoardProps {
  aiEnabled?: boolean;
}

type TimeControlOption = 180 | 300 | 600 | 0; // en segundos (3 min, 5 min, 10 min, Sin Tiempo)
type AiLevel = 'easy' | 'medium' | 'hard';

function ChessPieceIcon({ type, color }: { type: string; color: string }) {
  const isWhite = color === 'w';
  const fillColor = isWhite ? '#FFFFFF' : '#1E293B';
  const strokeColor = isWhite ? '#0F172A' : '#94A3B8';

  const pieces: Record<string, JSX.Element> = {
    p: (
      <path
        d="M 22,9 A 4,4 0 0,1 26,13 A 4,4 0 0,1 22,17 A 4,4 0 0,1 18,13 A 4,4 0 0,1 22,9 m -3,9 l 6,0 l 2,13 l -10,0 z M 12,33 l 20,0 l 0,3 l -20,0 z M 10,38 l 24,0 l 0,3 l -24,0 z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    ),
    r: (
      <path
        d="M 12,36 L 12,32 L 14,32 L 14,16 L 12,16 L 12,10 L 16,10 L 16,13 L 20,13 L 20,10 L 24,10 L 24,13 L 28,13 L 28,10 L 32,10 L 32,16 L 30,16 L 30,32 L 32,32 L 32,36 Z M 9,39 L 35,39 L 35,36 L 9,36 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    ),
    n: (
      <path
        d="M 22,10 C 22,10 21,8 14,12 C 12,13 11,15 11,18 C 11,21 14,21 15,21 C 12,24 10,29 13,32 C 24,26 25,23 25,20 C 25,17 23,12 22,10 Z M 10,38 L 34,38 L 34,35 L 10,35 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    ),
    b: (
      <path
        d="M 22,9 A 3,3 0 0,1 25,12 A 3,3 0 0,1 22,15 A 3,3 0 0,1 19,12 A 3,3 0 0,1 22,9 m -4,7 c 0,0 -4,6 -1,11 c 2,3 3,6 3,9 l 4,0 c 0,-3 1,-6 3,-9 c 3,-5 -1,-11 -1,-11 z M 13,38 l 18,0 l 0,3 l -18,0 z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    ),
    q: (
      <path
        d="M 9,26 L 11,12 L 17,21 L 22,10 L 27,21 L 33,12 L 35,26 Z M 9,30 L 35,30 L 35,27 L 9,27 Z M 11,35 L 33,35 L 33,32 L 11,32 Z M 9,39 L 35,39 L 35,37 L 8,37 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    ),
    k: (
      <path
        d="M 20,8 L 24,8 L 24,10 L 26,10 L 26,12 L 24,12 L 24,15 L 20,15 L 20,12 L 18,12 L 18,10 L 20,10 Z M 14,18 C 14,18 18,16 22,16 C 26,16 30,18 30,18 L 32,30 L 12,30 Z M 10,35 L 34,35 L 34,32 L 10,32 Z M 8,39 L 36,39 L 36,37 L 8,37 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.5"
      />
    ),
  };

  return (
    <svg viewBox="0 0 44 44" className="w-10 h-10 drop-shadow-md select-none pointer-events-none">
      {pieces[type]}
    </svg>
  );
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function formatTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ChessBoardComponent({ aiEnabled = true }: ChessBoardProps) {
  const [game, setGame] = useState(() => new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [aiLevel, setAiLevel] = useState<AiLevel>('medium');
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<string>('Turno de Blancas');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [tutorMessage, setTutorMessage] = useState<string>('¡Bienvenido! Selecciona una pieza para jugar.');
  const [materialScore, setMaterialScore] = useState<{ white: number; black: number }>({ white: 0, black: 0 });

  // Control de Tiempo (Relojes)
  const [timeLimit, setTimeLimit] = useState<TimeControlOption>(300); // 5 min por defecto
  const [whiteTime, setWhiteTime] = useState<number>(300);
  const [blackTime, setBlackTime] = useState<number>(300);
  const [isTimeOver, setIsTimeOver] = useState<boolean>(false);

  const historyList = game.history();

  // Telemetría: Registro de apertura del juego
  useEffect(() => {
    const profile = GuestProfileManager.getOrCreateProfile();
    GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'game_open', {
      game: 'chess',
    });
  }, []);

  // Reloj de tiempo continuo
  useEffect(() => {
    if (timeLimit === 0 || game.isGameOver() || isTimeOver || historyList.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      const turn = game.turn();
      const profile = GuestProfileManager.getOrCreateProfile();

      if (turn === 'w') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsTimeOver(true);
            setGameStatus('¡Tiempo agotado! Ganan las Negras ⏱️');
            setTutorMessage('Fin de la partida por expiración de tiempo.');

            const isWin = playerColor === 'b';
            GuestProfileManager.updateProfile({
              matches_played: profile.matches_played + 1,
              wins: isWin ? profile.wins + 1 : profile.wins,
              losses: isWin ? profile.losses : profile.losses + 1,
            });

            GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'timeout', {
              game: 'chess',
              winner: 'b',
            });
            GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', isWin ? 'victory' : 'defeat', {
              game: 'chess',
              reason: 'timeout',
            });

            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsTimeOver(true);
            setGameStatus('¡Tiempo agotado! Ganan las Blancas ⏱️');
            setTutorMessage('Fin de la partida por expiración de tiempo.');

            const isWin = playerColor === 'w';
            GuestProfileManager.updateProfile({
              matches_played: profile.matches_played + 1,
              wins: isWin ? profile.wins + 1 : profile.wins,
              losses: isWin ? profile.losses : profile.losses + 1,
            });

            GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'timeout', {
              game: 'chess',
              winner: 'w',
            });
            GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', isWin ? 'victory' : 'defeat', {
              game: 'chess',
              reason: 'timeout',
            });

            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game, timeLimit, isTimeOver, historyList.length, playerColor]);

  const calculateMaterial = useCallback((currentGame: Chess) => {
    let white = 0;
    let black = 0;

    currentGame.board().forEach((row) => {
      row.forEach((square) => {
        if (square) {
          const val = PIECE_VALUES[square.type];
          if (square.color === 'w') white += val;
          else black += val;
        }
      });
    });

    setMaterialScore({ white, black });
  }, []);

  const updateGame = useCallback(
    (newGame: Chess) => {
      const nextGame = new Chess(newGame.fen());
      nextGame.loadPgn(newGame.pgn());

      setGame(nextGame);
      calculateMaterial(nextGame);
      setHintSquare(null);

      const profile = GuestProfileManager.getOrCreateProfile();

      if (nextGame.isCheckmate()) {
        const winningColor = nextGame.turn() === 'w' ? 'b' : 'w';
        const winnerText = winningColor === 'w' ? 'Blancas' : 'Negras';
        const isWin = playerColor === winningColor;

        setGameStatus(`¡Jaque Mate! Ganan las ${winnerText}`);
        setTutorMessage(`Partida finalizada. ¡Victoria de las ${winnerText}!`);

        GuestProfileManager.updateProfile({
          matches_played: profile.matches_played + 1,
          wins: isWin ? profile.wins + 1 : profile.wins,
          losses: isWin ? profile.losses : profile.losses + 1,
        });

        GrowthAnalytics.getInstance().track(
          profile.guest_id,
          'GAME',
          isWin ? 'victory' : 'defeat',
          { game: 'chess', reason: 'checkmate' }
        );
      } else if (nextGame.isDraw()) {
        setGameStatus('Empate / Tablas');
        setTutorMessage('La partida ha terminado en empate.');

        GuestProfileManager.updateProfile({
          matches_played: profile.matches_played + 1,
        });

        GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'defeat', {
          game: 'chess',
          reason: 'draw',
        });
      } else if (nextGame.inCheck()) {
        setGameStatus(`¡Jaque a las ${nextGame.turn() === 'w' ? 'Blancas' : 'Negras'}!`);
        setTutorMessage('⚠️ ¡Atención! El rey está amenazado en Jaque.');
      } else {
        setGameStatus(`Turno de ${nextGame.turn() === 'w' ? 'Blancas' : 'Negras'}`);
      }

      saveGameState('chess', { fen: nextGame.fen() }, 'zen');
    },
    [calculateMaterial, playerColor]
  );

  const makeAiMove = useCallback(() => {
    if (isTimeOver) return;

    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;

    let chosenMove = moves[0];

    if (aiLevel === 'easy') {
      chosenMove = moves[Math.floor(Math.random() * moves.length)];
    } else if (aiLevel === 'medium') {
      const captureMoves = moves.filter((m) => m.captured);
      if (captureMoves.length > 0) {
        chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      } else {
        chosenMove = moves[Math.floor(Math.random() * moves.length)];
      }
    } else {
      const scoredMoves = moves.map((m) => {
        let score = 0;
        if (m.captured) score += (PIECE_VALUES[m.captured] || 1) * 10;
        if (m.san.includes('+')) score += 5;
        return { move: m, score };
      });

      scoredMoves.sort((a, b) => b.score - a.score);
      chosenMove = scoredMoves[0].move;
    }

    const gameCopy = new Chess(game.fen());
    gameCopy.loadPgn(game.pgn());
    const executedMove = gameCopy.move({
      from: chosenMove.from,
      to: chosenMove.to,
      promotion: 'q',
    });

    if (executedMove) {
      const profile = GuestProfileManager.getOrCreateProfile();
      GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'move', {
        game: 'chess',
        from: executedMove.from,
        to: executedMove.to,
        san: executedMove.san,
        captured: executedMove.captured || null,
        byAi: true,
      });
    }

    updateGame(gameCopy);
  }, [game, aiLevel, updateGame, isTimeOver]);

  useEffect(() => {
    const isAiTurn = game.turn() !== playerColor;
    if (isAiTurn && !game.isGameOver() && !isTimeOver && aiEnabled) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        makeAiMove();
        setIsAiThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game, playerColor, aiEnabled, makeAiMove, isTimeOver]);

  function handleSquareClick(squareName: string) {
    if (game.turn() !== playerColor || isAiThinking || game.isGameOver() || isTimeOver) return;

    if (!selectedSquare) {
      const piece = game.get(squareName as Square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(squareName);
        const validMoves = game.moves({ square: squareName as Square, verbose: true });
        setTutorMessage(
          `Pieza seleccionada: ${piece.type.toUpperCase()} en ${squareName}. Tienes ${validMoves.length} movimientos posibles.`
        );
      }
      return;
    }

    try {
      const gameCopy = new Chess(game.fen());
      gameCopy.loadPgn(game.pgn());

      const move = gameCopy.move({
        from: selectedSquare,
        to: squareName,
        promotion: 'q',
      });

      if (move) {
        const profile = GuestProfileManager.getOrCreateProfile();
        GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'move', {
          game: 'chess',
          from: move.from,
          to: move.to,
          san: move.san,
          captured: move.captured || null,
          byAi: false,
        });

        updateGame(gameCopy);
        if (move.captured) {
          setTutorMessage(`¡Buena captura! Has eliminado la pieza en ${squareName}.`);
        } else {
          setTutorMessage(`Movimiento ejecutado a ${squareName}. Turno del oponente.`);
        }
      }
    } catch {
      setTutorMessage('Movimiento no permitido. Intenta mover a una casilla válida.');
    }

    setSelectedSquare(null);
  }

  function requestHint() {
    if (game.turn() !== playerColor || game.isGameOver() || isTimeOver) return;
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return;

    const bestMove = moves.find((m) => m.captured) || moves[Math.floor(Math.random() * moves.length)];
    setHintSquare(bestMove.from);
    setTutorMessage(`💡 Sugerencia del Tutor: Intenta mover la pieza resaltada en verde (${bestMove.from.toUpperCase()}).`);

    const profile = GuestProfileManager.getOrCreateProfile();
    GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'hint', {
      game: 'chess',
      suggestedFrom: bestMove.from,
      suggestedTo: bestMove.to,
    });
  }

  function resetGame(newColor: 'w' | 'b' = playerColor, newTimeLimit: TimeControlOption = timeLimit) {
    const profile = GuestProfileManager.getOrCreateProfile();

    if (historyList.length > 0 && !game.isGameOver() && !isTimeOver) {
      GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'abandon', {
        game: 'chess',
        movesCount: historyList.length,
      });
    }

    GrowthAnalytics.getInstance().track(profile.guest_id, 'GAME', 'restart', {
      game: 'chess',
      newColor,
      timeLimit: newTimeLimit,
    });

    const newGame = new Chess();
    setPlayerColor(newColor);
    setTimeLimit(newTimeLimit);
    setWhiteTime(newTimeLimit);
    setBlackTime(newTimeLimit);
    setIsTimeOver(false);
    setGame(newGame);
    setGameStatus('Turno de Blancas');
    setTutorMessage('Partida reiniciada. ¡Buena suerte!');
    calculateMaterial(newGame);
    clearGameState('chess');
  }

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const displayRows = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const displayCols = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  const materialDiff = materialScore.white - materialScore.black;
  const boardMatrix = game.board();

  const historyRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < historyList.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = historyList[i];
      const blackMove = historyList[i + 1] || '...';

      rows.push(
        <div
          key={`move-row-${moveNum}-${whiteMove}`}
          className="grid grid-cols-12 py-1.5 px-1 border-b border-slate-800/50 hover:bg-slate-800/30 rounded transition-colors items-center"
        >
          <span className="col-span-2 text-slate-500 font-bold">{moveNum}.</span>
          <span className="col-span-5 text-emerald-400 font-semibold">{whiteMove}</span>
          <span className="col-span-5 text-purple-400 font-semibold">{blackMove}</span>
        </div>
      );
    }
    return rows;
  }, [historyList]);

  const topClockTime = playerColor === 'w' ? blackTime : whiteTime;
  const bottomClockTime = playerColor === 'w' ? whiteTime : blackTime;
  const topIsActiveTurn = playerColor === 'w' ? game.turn() === 'b' : game.turn() === 'w';
  const bottomIsActiveTurn = playerColor === 'w' ? game.turn() === 'w' : game.turn() === 'b';

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Panel Unificado de Controles */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4">
        {/* Bando */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Bando:</span>
          <button
            onClick={() => resetGame('w')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              playerColor === 'w'
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Blancas ♔
          </button>
          <button
            onClick={() => resetGame('b')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              playerColor === 'b'
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Negras ♚
          </button>
        </div>

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
              onClick={() => resetGame(playerColor, t.val as TimeControlOption)}
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

        {/* Dificultad IA */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">IA:</span>
          {(['easy', 'medium', 'hard'] as AiLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setAiLevel(level)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all ${
                aiLevel === level
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {level === 'easy' ? 'Fácil' : level === 'medium' ? 'Medio' : 'Maestro'}
            </button>
          ))}
        </div>

        <button
          onClick={requestHint}
          disabled={game.turn() !== playerColor || game.isGameOver() || isTimeOver}
          className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          💡 Pedir Pista
        </button>
      </div>

      {/* Tutor */}
      <div className="bg-slate-900/80 border border-purple-900/40 px-4 py-2.5 rounded-lg flex items-center gap-3">
        <span className="text-lg">🎓</span>
        <p className="text-xs text-purple-200 font-medium">{tutorMessage}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        {/* Tablero */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-6">
          {/* Jugador Superior (IA u Oponente) */}
          <div className="w-[480px] flex justify-between items-center mb-3 px-2 text-xs font-medium text-slate-300">
            <span className="font-semibold">{playerColor === 'w' ? `IA (${aiLevel})` : 'Tú'}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                Material: {playerColor === 'w' ? (materialDiff < 0 ? `+${Math.abs(materialDiff)}` : '') : (materialDiff > 0 ? `+${materialDiff}` : '')}
              </span>
              {timeLimit > 0 && (
                <span
                  className={`font-mono px-3 py-1 rounded font-bold border ${
                    topIsActiveTurn && !game.isGameOver() && !isTimeOver
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  ⏱️ {formatTime(topClockTime)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-8 grid-rows-8 w-[480px] h-[480px] border-2 border-slate-700 rounded-lg overflow-hidden select-none shadow-2xl">
            {displayRows.map((rowIndex) =>
              displayCols.map((colIndex) => {
                const squareName = `${files[colIndex]}${8 - rowIndex}`;
                const square = boardMatrix[rowIndex][colIndex];
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const isSelected = selectedSquare === squareName;
                const isHint = hintSquare === squareName;

                return (
                  <button
                    key={squareName}
                    onClick={() => handleSquareClick(squareName)}
                    className={`flex items-center justify-center transition-all duration-150 ${
                      isDark ? 'bg-slate-700' : 'bg-slate-500'
                    } ${isSelected ? 'ring-4 ring-yellow-400 z-10 bg-yellow-500/40' : ''} ${
                      isHint ? 'ring-4 ring-emerald-400 z-10 bg-emerald-500/40' : 'hover:opacity-90'
                    }`}
                  >
                    {square && <ChessPieceIcon type={square.type} color={square.color} />}
                  </button>
                );
              })
            )}
          </div>

          {/* Jugador Inferior (Usuario principal) */}
          <div className="w-[480px] flex justify-between items-center mt-3 px-2 text-xs font-medium text-slate-300">
            <span className="font-semibold">{playerColor === 'w' ? 'Tú' : `IA (${aiLevel})`}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                Material: {playerColor === 'w' ? (materialDiff > 0 ? `+${materialDiff}` : '') : (materialDiff < 0 ? `+${Math.abs(materialDiff)}` : '')}
              </span>
              {timeLimit > 0 && (
                <span
                  className={`font-mono px-3 py-1 rounded font-bold border ${
                    bottomIsActiveTurn && !game.isGameOver() && !isTimeOver
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  ⏱️ {formatTime(bottomClockTime)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between w-[480px] border-t border-slate-800 pt-4">
            <span className={`text-sm font-semibold ${isTimeOver ? 'text-red-400 animate-pulse' : 'text-purple-400'}`}>
              {gameStatus}
            </span>
            <button
              onClick={() => resetGame()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Reiniciar Partida
            </button>
          </div>
        </div>

        {/* Historial de Movimientos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-800 pb-2">
              Historial de Movimientos
            </h3>

            <div className="grid grid-cols-12 text-xs font-bold text-slate-400 pb-2 mb-2 border-b border-slate-800 px-1">
              <span className="col-span-2">#</span>
              <span className="col-span-5 text-emerald-400">♔ Blancas</span>
              <span className="col-span-5 text-purple-400">♚ Negras</span>
            </div>

            <div className="h-72 overflow-y-auto font-mono text-xs space-y-1 pr-1">
              {historyList.length === 0 ? (
                <p className="text-slate-500 italic py-2">No hay movimientos registrados.</p>
              ) : (
                historyRows
              )}
            </div>
          </div>

          {isAiThinking && (
            <div className="mt-4 p-3 bg-purple-950/40 border border-purple-800/50 rounded-lg flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span className="text-xs text-purple-300 font-medium">Calculando mejor jugada ({aiLevel})...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}