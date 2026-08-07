'use client';

import React from 'react';
import { Button } from '@nexus/ui';
import { useAuth } from '../../context/AuthContext';

interface GameGuardProps {
  children: React.ReactNode;
  /**
   * Si es true, bloquea completamente el acceso al juego para usuarios no autenticados.
   * Si es false, permite jugar pero muestra un banner recordatorio para registrarse.
   */
  requireAuth?: boolean;
  /** Título del juego o módulo a proteger */
  gameTitle?: string;
}

export default function GameGuard({
  children,
  requireAuth = false,
  gameTitle = 'este juego',
}: GameGuardProps) {
  const { user, openSignUp, openLogin } = useAuth();

  // Caso 1: El juego requiere autenticación obligatoria y el usuario no está registrado
  if (requireAuth && !user?.isAuthenticated) {
    return (
      <div className="w-full max-w-xl mx-auto my-12 bg-slate-900 border border-purple-500/30 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Fondo decorativo con resplandor */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-5xl block mb-4">🔒</span>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Contenido Restringido
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Para acceder a <span className="text-purple-400 font-semibold">{gameTitle}</span> y guardar tu puntuación en el ranking global, necesitas iniciar sesión o crear una cuenta gratuita.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={openSignUp}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/25"
            >
              Crear cuenta gratis
            </Button>
            <Button
              variant="outline"
              onClick={openLogin}
              className="w-full sm:w-auto border-slate-700 hover:border-slate-500 text-slate-300 px-6 py-2.5 rounded-xl"
            >
              Ya tengo cuenta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Caso 2: El usuario está registrado o el juego permite acceso libre con banner
  return (
    <div className="relative w-full">
      {/* Banner discreto de alerta para invitados en juegos de acceso libre */}
      {!user?.isAuthenticated && (
        <div className="mb-4 bg-slate-900/80 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <span className="text-amber-400 text-base">⚠️</span>
            <span>
              Estás jugando como <strong className="text-amber-300">Invitado</strong>. Tu progreso se guardará temporalmente en este navegador.
            </span>
          </div>
          <button
            onClick={openSignUp}
            className="text-purple-400 hover:text-purple-300 font-bold whitespace-nowrap underline"
          >
            Guardar progreso
          </button>
        </div>
      )}

      {/* Renderizado del Juego */}
      {children}
    </div>
  );
}