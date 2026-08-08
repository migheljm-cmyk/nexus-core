import { POST } from './route';
import { NextRequest } from 'next/server';
import { OsintRepository } from '@nexus/database';
import { OsintEngineService } from '@nexus/ai-engine';
import { trackOsintEvent } from '@nexus-core/growth';

// Mocks de las dependencias externas y repositorios
jest.mock('@nexus/database', () => ({
  OsintRepository: {
    getTargetById: jest.fn(),
    getEvidencesByTargetId: jest.fn(),
    createReport: jest.fn(),
    updateTargetRiskScore: jest.fn(),
  },
}));

jest.mock('@nexus/ai-engine', () => ({
  OsintEngineService: {
    analyzeTarget: jest.fn(),
  },
}));

jest.mock('@nexus-core/growth', () => ({
  trackOsintEvent: jest.fn(),
  OSINT_EVENT_TYPES: {
    REPORT_GENERATED: 'OSINT_REPORT_GENERATED',
  },
}));

describe('POST /api/osint/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar 400 si targetId no es proporcionado', async () => {
    const req = new NextRequest('http://localhost/api/osint/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain('Invalid or missing targetId');
  });

  it('debe retornar 404 si el target no existe en la BD', async () => {
    (OsintRepository.getTargetById as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/osint/analyze', {
      method: 'POST',
      body: JSON.stringify({ targetId: 'target-inexistente' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toContain('not found');
  });

  it('debe ejecutar el análisis, persistir y emitir evento exitosamente', async () => {
    // 1. Mock de datos de entrada
    const mockTarget = { id: 'target-123', companyName: 'Acme Corp', taxId: 'TAX123' };
    const mockEvidences = [
      { category: 'REGISTRY', sourceUrl: 'https://example.com', rawContent: 'Datos', metadata: {} }
    ];
    const mockAnalysisResult = {
      executiveSummary: 'Resumen de prueba',
      riskScore: 'LOW',
      matrixFindings: [],
      recommendations: ['Continuar monitoreo'],
    };
    const mockSavedReport = { id: 'report-999', ...mockAnalysisResult };

    (OsintRepository.getTargetById as jest.Mock).mockResolvedValue(mockTarget);
    (OsintRepository.getEvidencesByTargetId as jest.Mock).mockResolvedValue(mockEvidences);
    (OsintEngineService.analyzeTarget as jest.Mock).mockResolvedValue(mockAnalysisResult);
    (OsintRepository.createReport as jest.Mock).mockResolvedValue(mockSavedReport);

    // 2. Ejecutar petición
    const req = new NextRequest('http://localhost/api/osint/analyze', {
      method: 'POST',
      body: JSON.stringify({ targetId: 'target-123' }),
    });

    const res = await POST(req);
    const json = await res.json();

    // 3. Verificaciones
    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.reportId).toBe('report-999');

    // Confirmar que las orquestaciones de módulos ocurrieron
    expect(OsintEngineService.analyzeTarget).toHaveBeenCalledWith({
      companyName: 'Acme Corp',
      taxId: 'TAX123',
      evidences: mockEvidences,
    });
    expect(OsintRepository.updateTargetRiskScore).toHaveBeenCalledWith('target-123', 'LOW');
    expect(trackOsintEvent).toHaveBeenCalledTimes(1);
  });
});