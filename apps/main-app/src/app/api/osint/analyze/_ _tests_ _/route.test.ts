import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { OsintRepository } from '@nexus/database';
import { OsintEngineService } from '@nexus/ai-engine';

// Mocks de las dependencias externas
vi.mock('@nexus/database', () => ({
  OsintRepository: {
    getTargetById: vi.fn(),
    getEvidencesByTargetId: vi.fn(),
    createReport: vi.fn(),
    updateTargetRiskScore: vi.fn(),
  },
}));

vi.mock('@nexus/ai-engine', () => ({
  OsintEngineService: {
    analyzeTarget: vi.fn(),
  },
}));

vi.mock('@nexus-core/growth', () => ({
  trackOsintEvent: vi.fn().mockResolvedValue(true),
  OSINT_EVENT_TYPES: {
    REPORT_GENERATED: 'REPORT_GENERATED',
  },
}));

describe('API Route: POST /api/osint/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe responder 400 si targetId no se proporciona', async () => {
    const req = new NextRequest('http://localhost:3000/api/osint/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Invalid or missing targetId');
  });

  it('debe responder 404 si el objetivo no existe en la BD', async () => {
    vi.mocked(OsintRepository.getTargetById).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/osint/analyze', {
      method: 'POST',
      body: JSON.stringify({ targetId: 'target-000' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain('OsintTarget with ID target-000 not found');
  });

  it('debe procesar el análisis, calcular SHA-256 y retornar 201 Created', async () => {
    // Configuración de Mocks
    vi.mocked(OsintRepository.getTargetById).mockResolvedValueOnce({
      id: 'target-123',
      companyName: 'Hunan Fansen E-Commerce Co., Ltd.',
      taxId: 'TAX-998877',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(OsintRepository.getEvidencesByTargetId).mockResolvedValueOnce([
      {
        id: 'ev-1',
        category: 'GEOLOCATION',
        sourceUrl: 'https://maps.example.com',
        rawContent: 'Hilton Hotel Office Suite 402',
        metadata: {},
        createdAt: new Date(),
      } as any,
    ]);

    vi.mocked(OsintEngineService.analyzeTarget).mockResolvedValueOnce({
      executiveSummary: 'High risk entity due to temporary location.',
      riskScore: 85,
      globalScore: 40,
      overallRisk: 'HIGH',
      matrixFindings: ['Virtual address at Hilton Hotel'],
      recommendations: ['Request proof of operations'],
      flagsCount: { critical: 1, high: 1, medium: 0, low: 0 },
    } as any);

    vi.mocked(OsintRepository.createReport).mockResolvedValueOnce({
      id: 'report-abc-123',
      targetId: 'target-123',
      createdAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/osint/analyze', {
      method: 'POST',
      body: JSON.stringify({ targetId: 'target-123' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.caseId).toBe('CASE-REPORT-A');
    expect(json.hashSha256).toBeDefined();
    expect(json.hashSha256).toMatch(/^[a-f0-9]{64}$/); // Valida que sea una cadena SHA-256 válida de 64 caracteres
    expect(json.summary.targetName).toBe('Hunan Fansen E-Commerce Co., Ltd.');
  });
});