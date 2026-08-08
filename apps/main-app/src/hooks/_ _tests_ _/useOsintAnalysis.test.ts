import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOsintAnalysis } from '../useOsintAnalysis';

// Mock global de fetch
global.fetch = vi.fn();

describe('useOsintAnalysis Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe inicializarse con estados por defecto limpios', () => {
    const { result } = renderHook(() => useOsintAnalysis());

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.isDownloadingPdf).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('debe ejecutar runAnalysis exitosamente y actualizar data', async () => {
    const mockApiResponse = {
      caseId: 'CASE-001122',
      hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      summary: {
        targetName: 'Test Corporation',
        targetTaxId: 'TAX-123',
        globalScore: 80,
        riskScore: 20,
        overallRisk: 'LOW',
        verdict: 'Low risk verified.',
        keyFindings: ['Clear corporate history'],
        flagsCount: { critical: 0, high: 0, medium: 0, low: 1 },
        analyzedAt: '2026-08-08T09:00:00.000Z',
      },
      evidences: [],
      analysis: {
        matrixFindings: ['Verified domain age'],
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const { result } = renderHook(() => useOsintAnalysis());

    await act(async () => {
      await result.current.runAnalysis('target-123');
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.caseId).toBe('CASE-001122');
    expect(result.current.data?.hashSha256).toBe(mockApiResponse.hashSha256);
  });

  it('debe capturar errores de API en la propiedad error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Fallo crítico en el motor de ingesta OSINT.' }),
    } as Response);

    const { result } = renderHook(() => useOsintAnalysis());

    await act(async () => {
      await result.current.runAnalysis('target-err');
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Fallo crítico en el motor de ingesta OSINT.');
  });
});