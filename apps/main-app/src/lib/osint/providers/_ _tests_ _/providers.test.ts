import { analyzeDomainRisk } from '../tldRisk';
import { analyzeSatAndRegistry } from '../satCheck';
import { analyzeGlobalSanctionsAndGeo } from '../openSanctions';

describe('Suite de Pruebas: Conectores OSINT & Due Diligence', () => {

  // 1. Pruebas para tldRisk.ts
  describe('Módulo: Domain Risk & TLD Analyzer (tldRisk.ts)', () => {
    it('Debe identificar un TLD de alto riesgo y penalizar el puntaje', async () => {
      const result = await analyzeDomainRisk('empresa-sospechosa.top');
      
      expect(result.domain).toBe('empresa-sospechosa.top');
      expect(result.details.tld).toBe('top');
      expect(result.details.tldRiskCategory).toBe('HIGH_RISK');
      expect(result.riskScore).toBeGreaterThanOrEqual(30);
      expect(result.flags.some(f => f.includes('TLD de alto riesgo'))).toBe(true);
    });

    it('Debe procesar un dominio estándar correctamente', async () => {
      const result = await analyzeDomainRisk('empresa-valida.com');
      
      expect(result.domain).toBe('empresa-valida.com');
      expect(result.details.tld).toBe('com');
      expect(result.details.tldRiskCategory).toBe('STANDARD');
    });
  });

  // 2. Pruebas para satCheck.ts
  describe('Módulo: Prospección Nacional - SAT México (satCheck.ts)', () => {
    it('Debe rechazar un RFC sintácticamente inválido', async () => {
      const result = await analyzeSatAndRegistry('RFC-INVALIDO-999');
      
      expect(result.isValidRfc).toBe(false);
      expect(result.taxpayerType).toBe('INVALID_RFC');
      expect(result.riskScorePenalty).toBe(25);
      expect(result.flags).toContain('Formato de RFC inválido o mal estructurado');
    });

    it('Debe validar correctamente la estructura de un RFC de Persona Moral', async () => {
      const result = await analyzeSatAndRegistry('ABC010101XY3');
      
      expect(result.isValidRfc).toBe(true);
      expect(result.taxpayerType).toBe('PERSONA_MORAL');
      expect(result.satList69B).toBeDefined();
    });
  });

  // 3. Pruebas para openSanctions.ts
  describe('Módulo: Prospección Internacional & GeoIP (openSanctions.ts)', () => {
    it('Debe retornar estructura correcta en análisis de empresa sin sanciones', async () => {
      const result = await analyzeGlobalSanctionsAndGeo('Compañía Genérica Segura S.A.', 'empresa.com', 'MX');
      
      expect(result.targetName).toBe('Compañía Genérica Segura S.A.');
      expect(result.hasSanctionsMatch).toBe(false);
      expect(Array.isArray(result.sanctionMatches)).toBe(true);
      expect(Array.isArray(result.flags)).toBe(true);
    });
  });

});