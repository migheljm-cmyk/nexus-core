// apps/main-app/src/components/osint/OsintForm.tsx
'use client';

import React, { useState } from 'react';
import { OsintFormData } from '../../hooks/useOsintAnalysis';
import { Search, Terminal, AlertTriangle } from 'lucide-react';

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
  const [companyName, setCompanyName] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const isExecuting = externalIsLoading ?? externalLoading ?? false;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    
    const cleanCompany = companyName.trim();
    const cleanTaxId = taxId.trim();
    const cleanDomain = domain.trim();
    const cleanEmail = email.trim();

    // Requisito mínimo
    if (!cleanCompany && !cleanDomain && !cleanTaxId && !cleanEmail) {
      setFormError('Por favor ingrese al menos una razón social, dominio o correo.');
      return;
    }

    if (onAnalysisStart) onAnalysisStart();

    // Garantizar que el dominio y correo viajen explícitamente al Handler superior de la Página
    const payload: OsintFormData = {
      targetId: cleanCompany || cleanDomain || cleanTaxId || cleanEmail,
      companyName: cleanCompany,
      taxId: cleanTaxId || undefined,
      rfc: cleanTaxId || undefined,
      domain: cleanDomain || undefined,
      email: cleanEmail || undefined,
      domainOrEmail: cleanDomain || cleanEmail || undefined,
    };

    // Usar estrictamente las funciones pasadas por props desde OsintDashboardPage
    const analyzeFn = onAnalyze || onSubmit;

    if (typeof analyzeFn === 'function') {
      try {
        await analyzeFn(payload);
      } catch (err: any) {
        setFormError(err.message || 'Error al enviar la consulta.');
      }
    } else {
      console.warn('[OsintForm] No se proporcionó la prop onAnalyze u onSubmit.');
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

        {formError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>Error en el análisis: {formError}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isExecuting || (!companyName && !domain && !taxId && !email)}
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