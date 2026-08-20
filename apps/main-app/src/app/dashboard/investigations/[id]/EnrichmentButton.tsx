'use client';

import React, { useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';
import { triggerOsintEnrichment } from '../../../actions/inngest'; // Ajusta la ruta a tu Server Action

interface EnrichmentButtonProps {
  investigationId: string;
  targetRfc?: string;
  targetDomain?: string;
  targetEmail?: string;
  targetName?: string;
  onEnrichmentComplete?: () => void;
}

export const EnrichmentButton: React.FC<EnrichmentButtonProps> = ({
  investigationId,
  targetRfc,
  targetDomain,
  targetEmail,
  targetName,
  onEnrichmentComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleRunEnrichment = async () => {
    setLoading(true);
    setStatusMessage('Iniciando motores y orquestador Inngest...');

    try {
      // 1. Disparar el evento de Inngest mediante el Server Action
      await triggerOsintEnrichment({
        investigationId,
        targetRfc,
        targetDomain,
        targetEmail,
        targetName,
      });

      // 2. Preparar llamadas concurrentes a las API Routes de verificación inmediata
      const requests = [];

      if (targetRfc || targetName) {
        setStatusMessage('Consultando listas 69-B del SAT...');
        requests.push(
          fetch('/api/osint/sat-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              investigationId,
              rfc: targetRfc,
              name: targetName,
            }),
          }).then((res) => res.json())
        );
      }

      if (targetDomain || targetEmail) {
        setStatusMessage('Escaneando infraestructura digital y DNS/WHOIS...');
        requests.push(
          fetch('/api/osint/digital-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              investigationId,
              domain: targetDomain,
              email: targetEmail,
            }),
          }).then((res) => res.json())
        );
      }

      const results = await Promise.allSettled(requests);
      setStatusMessage('Sincronizando hallazgos con Bóveda de Evidencias...');

      // 3. Persistir nuevas evidencias en Supabase (`evidence_vault`)
      const evidencePayloads = [];

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value?.success) {
          const data = result.value.data;

          evidencePayloads.push({
            investigation_id: investigationId,
            source_module: result.value.module || 'OSINT_ENRICHMENT',
            evidence_type: result.value.type || 'AUTOMATED_DISCOVERY',
            raw_data: data,
            coi_score_impact: result.value.riskScore || 0,
            created_at: new Date().toISOString(),
          });
        }
      }

      if (evidencePayloads.length > 0) {
        const { error: evidenceError } = await supabase
          .from('evidence_vault')
          .insert(evidencePayloads);

        if (evidenceError) {
          console.error('Error insertando en evidence_vault:', evidenceError);
        }
      }

      setStatusMessage('¡Enriquecimiento e Inngest orquestados con éxito!');

      if (onEnrichmentComplete) {
        onEnrichmentComplete();
      }
    } catch (error) {
      console.error('Error en orquestación OSINT:', error);
      setStatusMessage('Error durante la ejecución del enriquecimiento.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setStatusMessage(null);
      }, 2500);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleRunEnrichment}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs font-semibold uppercase tracking-wider transition-all shadow-md ${
          loading
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95'
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-emerald-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Ejecutando OSINT...</span>
          </>
        ) : (
          <>
            <span>⚡ Ejecutar Enriquecimiento OSINT</span>
          </>
        )}
      </button>

      {statusMessage && (
        <span className="font-mono text-[11px] text-cyan-400 animate-pulse bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
          [{statusMessage}]
        </span>
      )}
    </div>
  );
};