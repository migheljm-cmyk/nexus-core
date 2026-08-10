// apps/main-app/src/hooks/useOsintAnalysis.ts

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
  evidence?: string;
}

export interface ExecutiveSummary {
  targetName: string;
  targetTaxId: string; // ✅ Ahora es string requerido (con fallback 'TAX-PENDING-001')
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
  category: 'CORPORATE' | 'GEOLOCATION' | 'COMMUNICATION' | 'FINANCIAL' | 'COMPLIANCE' | 'INFRASTRUCTURE';
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
  layer1Technical?: any;
  layer2Reputation?: any;
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
   * Mapea severidad a coordenadas visuales 'LOW' | 'MEDIUM' | 'HIGH' para RiskMatrix (3x3)
   */
  const mapSeverityToMatrixCoord = (severity: string): 'LOW' | 'MEDIUM' | 'HIGH' => {
    const sev = (severity || '').toUpperCase();
    if (sev === 'CRITICAL' || sev === 'HIGH') return 'HIGH';
    if (sev === 'MEDIUM') return 'MEDIUM';
    return 'LOW';
  };

  /**
   * Ejecuta el análisis OSINT enviando el payload al backend
   */
  const runAnalysis = useCallback(async (targetQuery: OsintFormData | string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Construir Payload
      let payload: Record<string, any> = {};

      if (typeof targetQuery === 'string') {
        const cleanQuery = targetQuery.trim();
        payload = {
          targetId: cleanQuery,
          companyName: cleanQuery,
          domain: cleanQuery.includes('.') && !cleanQuery.includes('@') ? cleanQuery : '',
          email: cleanQuery.includes('@') ? cleanQuery : '',
        };
      } else if (typeof targetQuery === 'object' && targetQuery !== null) {
        let domain = targetQuery.domain || '';
        let email = targetQuery.email || '';

        if (targetQuery.domainOrEmail) {
          const cleanValue = targetQuery.domainOrEmail.trim();
          if (cleanValue.includes('@')) {
            email = cleanValue;
          } else {
            domain = cleanValue;
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
        throw new Error('Se requiere una razón social, dominio o identificador válido.');
      }

      // 2. Petición al Endpoint de Análisis con cabeceras strict anti-caché
      const response = await fetch('/api/osint/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al ejecutar el análisis OSINT.');
      }

      // 3. Normalización y Mapeo de Banderas Rojas a la Matriz de Riesgo
      const rawFlags = result.riskMatrix || result.summary?.allFlags || result.analysis?.matrixFindings || [];

      const mappedRiskMatrix: RiskMatrixPoint[] = rawFlags.map((item: any, idx: number) => {
        if (typeof item === 'string') {
          return {
            id: `risk-${idx}`,
            title: `Alerta #${idx + 1}`,
            category: 'INFRASTRUCTURE',
            impact: 'HIGH',
            probability: 'HIGH',
            severity: 'HIGH',
            description: item,
          };
        }

        const sev = (item.severity || 'MEDIUM').toUpperCase() as RiskLevel;
        return {
          id: item.id || `risk-${idx}`,
          title: item.title || item.code || `Hallazgo ${idx + 1}`,
          category: item.category || 'INFRASTRUCTURE',
          impact: mapSeverityToMatrixCoord(sev),
          probability: item.probability ? (String(item.probability).toUpperCase() as any) : 'HIGH',
          severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(sev) ? sev : 'MEDIUM',
          description: item.description || item.evidence || '',
          evidence: item.evidence || '',
        };
      });

      // 4. Mapeo de Evidencias / Lógica de Tiempo
      const rawEvidences: EvidenceEvent[] = result.evidences || result.timeline || [];

      if (rawEvidences.length === 0 && result.layer1Technical) {
        rawEvidences.push({
          id: 'ev-layer1',
          timestamp: result.layer1Technical.timestamp || new Date().toISOString(),
          source: 'DNS/WHOIS/RDAP',
          category: 'INFRASTRUCTURE',
          description: `Escaneo técnico completado para ${result.layer1Technical.domain}. IP: ${result.layer1Technical.ip?.ip || 'N/A'}.`,
          status: 'VERIFIED',
        });
      }

      // 5. Construcción de Resumen Ejecutivo Consolidado directo desde la Respuesta
      const summary: ExecutiveSummary = {
        targetName: result.summary?.targetName || payload.companyName || payload.domain || 'Objetivo Desconocido',
        targetTaxId: result.summary?.targetTaxId || payload.rfc || 'TAX-PENDING-001',
        globalScore: typeof result.summary?.globalScore === 'number' 
          ? result.summary.globalScore 
          : (100 - (result.summary?.riskScore ?? 0)),
        riskScore: typeof result.summary?.riskScore === 'number' 
          ? result.summary.riskScore 
          : (result.summary?.overallRiskScore ?? 0),
        overallRisk: result.summary?.overallRisk || result.summary?.overallRiskLevel || 'LOW',
        verdict: result.summary?.verdict || 'Dictamen técnico procesado.',
        keyFindings: result.summary?.keyFindings || mappedRiskMatrix.map((m) => m.description || m.title),
        analyzedAt: result.summary?.analyzedAt || new Date().toISOString(),
        flagsCount: result.summary?.flagsCount || {
          critical: mappedRiskMatrix.filter((m) => m.severity === 'CRITICAL').length,
          high: mappedRiskMatrix.filter((m) => m.severity === 'HIGH').length,
          medium: mappedRiskMatrix.filter((m) => m.severity === 'MEDIUM').length,
          low: mappedRiskMatrix.filter((m) => m.severity === 'LOW').length,
        },
      };

      const formattedResult: OsintAnalysisResult = {
        caseId: result.caseId || `CASE-${Date.now().toString(36).toUpperCase()}`,
        hashSha256: result.hashSha256 || result.auditTrail?.payloadHash || '',
        summary,
        timeline: rawEvidences,
        evidences: rawEvidences,
        riskMatrix: mappedRiskMatrix,
        layer1Technical: result.layer1Technical,
        layer2Reputation: result.layer2Reputation,
        modules: result.modules || {},
      };

      // Asignación directa y definitiva al estado
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
   * Descarga del reporte PDF criptográfico
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
        const errorJson = await response.json().catch(() => ({}));
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