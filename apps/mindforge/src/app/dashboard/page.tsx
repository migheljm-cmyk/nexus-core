'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@nexus/ui';
import { useAuth, CapabilityEngine } from '@nexus/auth';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();

  // Evaluación declarativa basada en capacidades
  const isAuthorized = isAuthenticated && CapabilityEngine.can(user, 'access:dashboard');

  if (!isAuthorized) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md shadow-2xl relative overflow-hidden">
          {/* Resplandor decorativo de advertencia */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

          <span className="text-5xl block mb-4">🛡️</span>
          <h1 className="text-2xl font-black text-white mb-2">Acceso Restringido</h1>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            El Dashboard administrativo y las métricas avanzadas de rendimiento están reservados exclusivamente para socios y administradores de MindForge.
          </p>

          <Link href="/">
            <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-600/20">
              Volver al Portal Principal
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Administrativo</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Bienvenido, <span className="text-purple-400 font-semibold">{user?.name || 'Socio'}</span> ({user?.role?.toUpperCase()})
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">← Volver al Portal</Button>
        </Link>
      </div>

      {/* MÉTRICAS PRIVADAS DEL SISTEMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-xs font-medium">Usuarios Activos Hoy</p>
          <p className="text-3xl font-extrabold text-white mt-2">1,248</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-xs font-medium">Partidas Completadas</p>
          <p className="text-3xl font-extrabold text-purple-400 mt-2">8,912</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-xs font-medium">Conversión Guest → Registrado</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">14.2%</p>
        </div>
      </div>
    </main>
  );
}