'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@nexus/ui';
import { useAuth, CapabilityEngine } from '@nexus/auth';

export default function AdminConsolePage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit'>('overview');

  // Guard de Capacidad
  const isAuthorized = isAuthenticated && CapabilityEngine.can(user, 'access:admin_console');

  if (!isAuthorized) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md shadow-2xl">
          <span className="text-5xl block mb-4">🚫</span>
          <h1 className="text-2xl font-black text-white mb-2">Consola Denegada</h1>
          <p className="text-slate-400 text-xs mb-6">
            Se requieren privilegios de Administrador para acceder a la Consola Empresarial de NEXUS CORE.
          </p>
          <Link href="/">
            <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl">
              Volver al Inicio
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Backoffice */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/10 text-purple-400 text-xs font-semibold px-2.5 py-1 rounded-md border border-purple-500/20">
              NEXUS CORE Backoffice
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">Consola de Administración</h1>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">← Ver Dashboard</Button>
        </Link>
      </div>

      {/* Tabs Naves */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'overview' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Vista General
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'users' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Usuarios & Roles
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'audit' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Audit Trails
        </button>
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-slate-400 text-xs">Organización Principal</p>
            <p className="text-2xl font-bold text-white mt-1">MindForge Global</p>
            <span className="inline-block mt-3 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              Tier Enterprise
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-slate-400 text-xs">Estado de API Guards</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">Activo 🛡️</p>
            <p className="text-xs text-slate-500 mt-3">Middleware centralizado protegiendo rutas</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-slate-400 text-xs">Eventos de Auditoría</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">Capturando</p>
            <p className="text-xs text-slate-500 mt-3">Sincronizado con Supabase audit_logs</p>
          </div>
        </div>
      )}

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Gestión de Roles y Permisos</h2>
          <p className="text-slate-400 text-xs mb-6">
            Capability Engine activo. Mapeo dinámico de permisos por rol (`admin`, `partner`, `user`, `guest`).
          </p>
          <div className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
            Admin: [access:admin_console, access:dashboard, manage:users, manage:roles, read:analytics, read:audit_logs]<br/>
            Partner: [access:dashboard, read:analytics]<br/>
            User: [access:games, read:own_profile]<br/>
            Guest: [access:public_games]
          </div>
        </div>
      )}

      {/* Tab Content: Audit */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Registro de Auditoría Centralizado</h2>
          <p className="text-slate-400 text-xs mb-6">Eventos del sistema capturados en tiempo real.</p>
          <div className="text-xs font-mono text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800">
            [LOG] AUTH_LOGIN | user: admin@mindforge.com | resource: /admin | status: 200 OK
          </div>
        </div>
      )}
    </main>
  );
}