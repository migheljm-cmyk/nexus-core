// apps/main-app/src/lib/osint/actions/getOsintAnalysis.ts
'use server';

import { getLayer1Data } from './getLayer1Data';
import { resolveSslCertificate } from '../layer2/tlsResolver';
import { resolveSerperDorks } from '../layer2/serperResolver';
import { evaluateAllFlags, calculateRiskFromFlags } from '../evaluators/flagEngine';
import { buildLayer4Prompt } from '../layer4/layer4Synthesizer';
import { OsintAnalysisReport, OsintTargetInput, Layer2ReputationResult } from '../types';
import crypto from 'node:crypto';

export async function runOsintAnalysisAction(target: OsintTargetInput & { domainOrEmail?: string }): Promise<OsintAnalysisReport> {
  // Extraer el dominio priorizando el campo explícito o domainOrEmail
  const rawDomain = target.domain || target.domainOrEmail || '';
  const cleanDomain = rawDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!cleanDomain || !cleanDomain.includes('.')) {
    throw new Error('Por favor, ingrese un Dominio Web válido (ej. empresa.com) para poder ejecutar la recolección técnica de infraestructura.');
  }

  // 1. CAPA 1 y CAPA 2 (Recolección en vivo de APIs / Sockets)
  const [layer1Result, sslResult, serperResult] = await Promise.all([
    getLayer1Data(cleanDomain),
    resolveSslCertificate(cleanDomain),
    resolveSerperDorks(target.companyName || cleanDomain),
  ]);

  const layer2Result: Layer2ReputationResult = {
    ssl: sslResult,
    serperDorks: serperResult,
  };

  // 2. CAPA 3 (Motor de Banderas Rojas y Score Determinista)
  const flags = evaluateAllFlags(layer1Result, layer2Result);
  const risk = calculateRiskFromFlags(flags);

  // 3. CAPA 4 (Generación del Prompt Analítico para el LLM)
  const l4Prompt = buildLayer4Prompt(
    target.companyName || cleanDomain,
    layer1Result,
    layer2Result,
    flags,
    risk.score,
    risk.level
  );

  // 4. Auditoría Criptográfica (SHA-256)
  const timestamp = new Date().toISOString();
  const rawPayload = JSON.stringify({ target, layer1Result, layer2Result, flags, risk, timestamp });
  const payloadHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

  // 5. Retornar el reporte unificado
  return {
    target,
    summary: {
      overallRiskScore: risk.score,
      overallRiskLevel: risk.level,
      totalFlagsCount: flags.length,
      criticalAlerts: flags.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').map((f) => f.title),
      allFlags: flags,
    },
    layer1Technical: layer1Result,
    layer2Reputation: layer2Result,
    modules: {},
    auditTrail: {
      payloadHash,
      timestamp,
      apiVersion: '1.0.0-beta',
      environment: process.env.NODE_ENV || 'development',
    },
  };
}