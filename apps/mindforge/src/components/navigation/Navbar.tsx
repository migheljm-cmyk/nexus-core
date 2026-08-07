'use client';

import React from 'react';
import { Button } from '@nexus/ui';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, openLogin, openSignUp, logout } = useAuth();

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* LOGO DE LA PLATAFORMA */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            MindForge
          </span>
        </div>

        {/* ÁREA DE USUARIO Y ACCIONES */}
        <div className="flex items-center gap-4">
          {user?.isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">{user.name || 'Usuario'}</p>
                <p className="text-[10px] text-purple-400">{user.email}</p>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                className="text-xs border-slate-700 hover:border-rose-500 hover:text-rose-400"
              >
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openLogin}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Iniciar Sesión
              </button>
              <Button
                onClick={openSignUp}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition-colors"
              >
                Registrarme
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}