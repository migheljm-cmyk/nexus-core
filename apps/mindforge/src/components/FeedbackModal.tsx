'use client';

import React, { useState } from 'react';
import { GrowthAnalytics } from '@nexus-core/growth';
import { markFeedbackSubmitted } from '../lib/guest-session';

interface FeedbackModalProps {
  guestId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ guestId, isOpen, onClose }: FeedbackModalProps) {
  const [favoriteGame, setFavoriteGame] = useState('');
  const [improvement, setImprovement] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    GrowthAnalytics.getInstance().track(guestId, 'feedback', 'submit_survey', {
      favoriteGame,
      improvement,
      wouldRecommend,
    });

    markFeedbackSubmitted();
    setSubmitted(true);

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-indigo-400">
              ¡5 partidas completadas! 🎯
            </h2>
            <p className="text-sm text-slate-300">
              Ayúdanos a perfeccionar MindForge con 3 preguntas rápidas:
            </p>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                1. ¿Qué juego disfrutaste más?
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Memoria Cuántica, Reflejos..."
                value={favoriteGame}
                onChange={(e) => setFavoriteGame(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                2. ¿Qué mejorarías?
              </label>
              <textarea
                required
                rows={2}
                placeholder="Velocidad, diseño, más dificultad..."
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                3. ¿Lo recomendarías a un colega/amigo?
              </label>
              <div className="flex gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                    wouldRecommend === true
                      ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Sí, seguro
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                    wouldRecommend === false
                      ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Aún no
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Omitir
              </button>
              <button
                type="submit"
                disabled={wouldRecommend === null}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-50"
              >
                Enviar Feedback
              </button>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center">
            <p className="text-lg font-bold text-emerald-400">¡Gracias por tu apoyo!</p>
            <p className="text-xs text-slate-400">Tus respuestas nos ayudan a iterar rápido.</p>
          </div>
        )}
      </div>
    </div>
  );
}