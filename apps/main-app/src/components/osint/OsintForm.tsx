'use client';

import React, { useState } from 'react';
// Ruta relativa corregida hacia src/hooks/
import { useOsintAnalysis, OsintFormData } from '../../hooks/useOsintAnalysis';
import { Shield, Search, Terminal, AlertTriangle } from 'lucide-react';

export interface OsintFormProps {
  onAnalyze?: (formData: OsintFormData | string) => Promise<void> | void;
  onSubmit?: (formData: OsintFormData | string) => Promise<void> | void;
  onAnalysisStart?: () => void;
  isLoading?: boolean;
  loading?: boolean;
}

export const OsintForm: React.FC<OsintFormProps> = ({
  onAnalyze,
  onSubmit,
  onAnalysisStart,
  isLoading: externalIsLoading,
  loading: externalLoading,
}) => {
  // Invocación del hook con fallback seguro
  const hook = useOsintAnalysis();

  const [companyName, setCompanyName] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Resolver estados prioritarios (props vs hook)
  const isExecuting = externalIsLoading ?? externalLoading ?? hook.isAnalyzing;
  const activeError = hook.error;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyName && !domain && !taxId) return;

    if (onAnalysisStart) onAnalysisStart();

    const payload: OsintFormData = {
      companyName: companyName.trim(),
      taxId: taxId.trim() || undefined,
      domainOrEmail: domain.trim() || email.trim() || undefined,
    };

    // Ejecutar el handler externo si fue provisto por prop; de lo contrario, usar el del hook
    const analyzeFn = onAnalyze || onSubmit || hook.analyze || hook.runAnalysis;

    if (typeof analyzeFn === 'function') {
      const targetQuery = companyName.trim() || domain.trim() || taxId.trim();
      await analyzeFn(targetQuery || payload);
    }
  };

  return (
    <div className="w-full bg-[#161B22] border border-[#30363D] rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-2">
        <Terminal className="w-6 h-6 text-[#22C55E]" />
        <h2 className="text-xl font-bold font-mono text-gray-100 tracking-tight">
          ANÁLISIS DUE DILIGENCE & OSINT B2B
        </h2>
      </div>
      <p className="text-xs font-mono text-gray-400 mb-6 border-b border-[#30363D] pb-3">
        // Ingrese los identificadores del Target corporativo para iniciar la orquestación de evaluación de riesgo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Razón Social / Empresa *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Acme Corp LLC"
              value={companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 font-mono focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] disabled:opacity-50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Identificador Fiscal (Tax ID / RFC)
            </label>
            <input
              type="text"
              placeholder="Ej. ABC123456789"
              value={taxId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxId(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 font-mono focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] disabled:opacity-50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Dominio Web
            </label>
            <input
              type="text"
              placeholder="Ej. acmecorp.com"
              value={domain}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDomain(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 font-mono focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] disabled:opacity-50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Correo Institucional / Contacto
            </label>
            <input
              type="email"
              placeholder="Ej. contact@acmecorp.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={isExecuting}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 font-mono focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] disabled:opacity-50 transition-all"
            />
          </div>
        </div>

        {activeError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>Error en el análisis: {activeError}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isExecuting || (!companyName && !domain && !taxId)}
            className="flex items-center gap-2 bg-[#22C55E] hover:bg-emerald-500 text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-lg shadow-emerald-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-[#0D1117] border-t-transparent rounded-full" />
                <span>Ejecutando Orquestación...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Iniciar Análisis OSINT</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};