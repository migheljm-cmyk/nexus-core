'use client';

import React from 'react';
import { Button } from '@nexus/ui';
import { useAuth } from '../../context/AuthContext';

export interface SignUpModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

export default function SignUpModal({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  onSwitchToLogin: propsOnSwitchToLogin,
}: SignUpModalProps = {}) {
  const { isSignUpOpen, closeSignUp, openLogin } = useAuth();

  // Preferimos las props pasadas por el padre, o usamos el contexto como fallback
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : isSignUpOpen;
  const handleClose = propsOnClose || closeSignUp;
  const handleSwitchToLogin = () => {
    if (propsOnSwitchToLogin) {
      propsOnSwitchToLogin();
    } else {
      closeSignUp();
      openLogin();
    }
  };

  if (!isOpen) return null;

  const handleSocialSignUp = (provider: string) => {
    console.log(`Iniciando registro con ${provider}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        {/* Botón Cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-white text-center mb-1">
          Crear una cuenta
        </h2>
        <p className="text-slate-400 text-xs text-center mb-6">
          Guarda tu progreso, rachas y compite en el ranking global de MindForge.
        </p>

        {/* BOTONES DE REGISTRO SOCIAL (OAuth) */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSocialSignUp('Google')}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm py-2.5 rounded-xl border border-slate-700 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuar con Google
          </button>

          <button
            onClick={() => handleSocialSignUp('GitHub')}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm py-2.5 rounded-xl border border-slate-700 transition-all"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continuar con GitHub
          </button>
        </div>

        {/* DIVISOR */}
        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase font-semibold">
            O con tu correo
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* FORMULARIO TRADICIONAL */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de Usuario
            </label>
            <input
              type="text"
              placeholder="Ej. MindMaster"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20">
            Crear Cuenta
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={handleSwitchToLogin}
            className="text-purple-400 font-bold hover:underline"
          >
            Inicia Sesión
          </button>
        </div>
      </div>
    </div>
  );
}