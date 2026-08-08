import { useState, useCallback } from 'react';

// --- CONTRATOS DE DATOS OSINT ---

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskMatrixPoint {
  impact: 1 | 2 | 3;     // 1: Bajo, 2: Medio, 3: Alto
  probability: 1 | 2 | 3; // 1: Bajo, 2: Medio, 3: Alto
  label: string;
}

export interface ExecutiveSummary {
  targetName: string;
  targetTaxId: string;
  globalScore: number;
  riskScore: number;
  overallRisk: RiskLevel;
  verdict: string;
  keyFindings: string[];
  analyzedAt: string;
  flagsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface EvidenceEvent {
  id: string;
  timestamp: string;
  source: string;
  category: 'CORPORATE' | 'GEOLOCATION' | 'COMMUNICATION' | 'FINANCIAL';
  description: string;
  status: 'VERIFIED' | 'SUSPICIOUS' | 'UNVERIFIED';
}

export interface OsintAnalysisResult {
  caseId: string;
  hashSha256: string;
  summary: ExecutiveSummary;
  riskMatrix: RiskMatrixPoint[];
  timeline: EvidenceEvent[];
}

export interface OsintFormData {
  targetId?: string;
  companyName?: string;
  taxId?: string;
  domainOrEmail?: string;
}

export interface UseOsintAnalysisReturn {
  isAnalyzing: boolean;
  isLoading: boolean;
  isDownloadingPdf: boolean;
  error: string | null;
  data: OsintAnalysisResult | null;
  runAnalysis: (targetQuery: OsintFormData | string) => Promise<void>;
  analyze: (targetQuery: OsintFormData | string) => Promise<void>;
  downloadPdfReport: () => Promise<void>;
  resetAnalysis: () => void;
}

// --- HOOK PRINCIPAL ---

export function useOsintAnalysis(): UseOsintAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OsintAnalysisResult | null>(null);

  /**
   * Ejecuta el análisis OSINT llamando a la API Route /api/osint/analyze
   */
  const runAnalysis = useCallback(async (targetQuery: OsintFormData | string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Determinar targetId o parámetro de búsqueda
      let targetId = typeof targetQuery === 'string' ? targetQuery : targetQuery.targetId;

      if (!targetId && typeof targetQuery === 'object') {
        targetId = targetQuery.companyName || targetQuery.taxId;
      }

      if (!targetId) {
        throw new Error('Se requiere un ID de objetivo o nombre de empresa válido.');
      }

      const response = await fetch('/api/osint/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al ejecutar el análisis OSINT.');
      }

      // Mapear respuesta estandarizada
      const formattedResult: OsintAnalysisResult = {
        caseId: result.caseId,
        hashSha256: result.hashSha256,
        summary: result.summary,
        timeline: result.evidences || [],
        riskMatrix: result.analysis?.matrixFindings?.map((finding: string, idx: number) => ({
          impact: (idx % 3 + 1) as 1 | 2 | 3,
          probability: (idx % 2 + 1) as 1 | 2 | 3,
          label: finding,
        })) || [
          { impact: 3, probability: 3, label: 'Inconsistencia de Domicilio Fiscal' },
          { impact: 3, probability: 2, label: 'Canales de Comunicación No Corporativos' },
        ],
      };

      setData(formattedResult);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar la investigación OSINT.';
      setError(errorMessage);
      console.error('[USE_OSINT_ANALYSIS_ERROR]:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Descarga el reporte PDF criptográfico consumiendo el endpoint de streaming
   */
  const downloadPdfReport = useCallback(async () => {
    if (!data) {
      setError('No hay datos de reporte disponibles para exportar.');
      return;
    }

    setIsDownloadingPdf(true);
    setError(null);

    try {
      const payload = {
        caseId: data.caseId,
        summary: data.summary,
        evidences: data.timeline,
        hashSha256: data.hashSha256,
      };

      const response = await fetch('/api/osint/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || 'Error en la generación del PDF.');
      }

      // Procesar blob y forzar descarga binaria en el navegador
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OSINT_Audit_${data.caseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fallo al descargar el reporte PDF.';
      setError(msg);
      console.error('[PDF_DOWNLOAD_ERROR]:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [data]);

  const resetAnalysis = useCallback(() => {
    setData(null);
    setError(null);
    setIsAnalyzing(false);
    setIsDownloadingPdf(false);
  }, []);

  return {
    isAnalyzing,
    isLoading: isAnalyzing,
    isDownloadingPdf,
    error,
    data,
    runAnalysis,
    analyze: runAnalysis,
    downloadPdfReport,
    resetAnalysis,
  };
}