import { useState, useCallback } from 'react';

// --- CONTRATOS DE DATOS OSINT ---

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskMatrixPoint {
  id: string;
  title: string;
  category: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  severity: RiskLevel;
  description: string;
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
  category: 'CORPORATE' | 'GEOLOCATION' | 'COMMUNICATION' | 'FINANCIAL' | 'COMPLIANCE';
  description: string;
  status: 'VERIFIED' | 'SUSPICIOUS' | 'CRITICAL' | 'UNVERIFIED';
}

export interface OsintAnalysisResult {
  caseId: string;
  hashSha256: string;
  summary: ExecutiveSummary;
  riskMatrix: RiskMatrixPoint[];
  timeline: EvidenceEvent[];
  evidences?: EvidenceEvent[];
  modules?: any;
}

export interface OsintFormData {
  targetId?: string;
  companyName?: string;
  taxId?: string;
  rfc?: string;
  domain?: string;
  email?: string;
  domainOrEmail?: string;
  declaredCountryCode?: string;
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
   * Mapea el nivel de severidad a cadenas 'LOW' | 'MEDIUM' | 'HIGH' para la Matriz Visual 3x3
   */
  const mapSeverityToMatrixCoord = (severity: string): 'LOW' | 'MEDIUM' | 'HIGH' => {
    const sev = (severity || '').toUpperCase();
    if (sev === 'CRITICAL' || sev === 'HIGH') return 'HIGH';
    if (sev === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  };

  /**
   * Ejecuta el análisis OSINT llamando a la API Route /api/osint/analyze
   */
  const runAnalysis = useCallback(async (targetQuery: OsintFormData | string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Extraer y construir el Payload completo recolectado por la UI
      let payload: Record<string, any> = {};

      if (typeof targetQuery === 'string') {
        payload = {
          targetId: targetQuery.trim(),
          companyName: targetQuery.trim(),
        };
      } else if (typeof targetQuery === 'object' && targetQuery !== null) {
        // Manejar correos / dominios combinados en domainOrEmail si el formulario los envía en ese campo
        let domain = targetQuery.domain || '';
        let email = targetQuery.email || '';

        if (targetQuery.domainOrEmail) {
          if (targetQuery.domainOrEmail.includes('@')) {
            email = targetQuery.domainOrEmail.trim();
          } else {
            domain = targetQuery.domainOrEmail.trim();
          }
        }

        payload = {
          targetId: targetQuery.targetId || targetQuery.companyName || targetQuery.taxId || domain || email,
          companyName: targetQuery.companyName || '',
          rfc: targetQuery.rfc || targetQuery.taxId || '',
          domain,
          email,
          declaredCountryCode: targetQuery.declaredCountryCode || 'MX',
        };
      }

      if (!payload.targetId && !payload.companyName && !payload.domain && !payload.rfc && !payload.email) {
        throw new Error('Se requiere un ID de objetivo, nombre de empresa, dominio o correo válido.');
      }

      // 2. Petición POST con el Payload enriquecido
      const response = await fetch('/api/osint/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al ejecutar el análisis OSINT.');
      }

      // 3. Transformación y mapeo estricto para RiskMatrix.tsx y EvidenceTimeline.tsx
      const rawMatrix = result.riskMatrix || result.analysis?.matrixFindings || [];
      const mappedRiskMatrix: RiskMatrixPoint[] = rawMatrix.map((item: any, idx: number) => {
        // Si el item viene como string básico
        if (typeof item === 'string') {
          return {
            id: `risk-${idx}`,
            title: `Hallazgo OSINT #${idx + 1}`,
            category: 'OSINT',
            impact: (idx % 2 === 0 ? 'HIGH' : 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
            probability: 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH',
            severity: 'HIGH' as RiskLevel,
            description: item,
          };
        }

        const sev = (item.severity || 'MEDIUM').toUpperCase();
        return {
          id: item.id || `risk-${idx}`,
          title: item.title || item.label || `Hallazgo ${idx + 1}`,
          category: item.category || 'OSINT',
          impact: mapSeverityToMatrixCoord(sev),
          probability: item.probability && typeof item.probability === 'string' 
            ? (item.probability.toUpperCase() as any) 
            : 'HIGH',
          severity: (sev === 'CRITICAL' ? 'CRITICAL' : sev === 'HIGH' ? 'HIGH' : sev === 'LOW' ? 'LOW' : 'MEDIUM') as RiskLevel,
          description: item.description || '',
        };
      });

      const rawEvidences = result.evidences || result.timeline || [];

      const formattedResult: OsintAnalysisResult = {
        caseId: result.caseId,
        hashSha256: result.hashSha256,
        summary: result.summary,
        timeline: rawEvidences,
        evidences: rawEvidences,
        riskMatrix: mappedRiskMatrix,
        modules: result.modules,
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
   * Descarga el reporte PDF criptográfico
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
        evidences: data.timeline || data.evidences,
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