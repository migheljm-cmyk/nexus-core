'use client';

import React, { useState } from 'react';
import { Button } from '@nexus/ui';
import { GrowthAnalytics, GuestProfileManager } from '@mindforge/growth';
import { useAuth, UserRole } from '../../context/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

// Listas blancas de prueba para desarrollo
const ADMIN_EMAILS = ['admin@mindforge.com', 'miguel@mindforge.com'];
const PARTNER_EMAILS = ['socio@mindforge.com', 'partner@mindforge.com'];

export default function LoginForm({ onSuccess, onSwitchToSignUp }: LoginFormProps) {
  const { loginSuccess } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);

    try {
      // Determinamos el rol según la lista blanca de correos
      let assignedRole: UserRole = 'user';
      const cleanEmail = email.toLowerCase().trim();

      if (ADMIN_EMAILS.includes(cleanEmail)) {
        assignedRole = 'admin';
      } else if (PARTNER_EMAILS.includes(cleanEmail)) {
        assignedRole = 'partner';
      }

      const guestProfile = GuestProfileManager.getOrCreateProfile();
      const guestId = guestProfile?.guest_id || 'guest_unknown';

      // Registro de telemetría: login de usuario
      GrowthAnalytics.getInstance().track(guestId, 'AUTH', 'user_login', {
        email: cleanEmail,
        role: assignedRole,
        timestamp: new Date().toISOString(),
      });

      // Disparamos la actualización global en AuthContext
      loginSuccess({
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: assignedRole,
      });

      setIsLoading(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Ocurrió un error al iniciar sesión. Verifica tus credenciales.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white">Iniciar Sesión</h2>
        <p className="text-xs text-slate-400 mt-1">
          Ingresa a tu cuenta para sincronizar tu progreso y estadísticas.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors mt-2"
        >
          {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
        </Button>
      </form>

      {onSwitchToSignUp && (
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
          ¿Aún no tienes cuenta?{' '}
          <button
            onClick={onSwitchToSignUp}
            className="text-purple-400 hover:underline font-semibold"
          >
            Regístrate aquí
          </button>
        </div>
      )}
    </div>
  );
}