// apps/main-app/src/lib/osint/crypto.ts
import { webcrypto, createHash } from 'node:crypto';
import { CryptographicSealResult } from './forensics';

/**
 * Función heredada / existente para hashing rápido de objetos
 */
export async function generatePayloadHash(payload: unknown): Promise<string> {
  const jsonString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);

  const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera una firma criptográfica SHA-256 para sellar la evidencia en la cadena de custodia WORM.
 */
export function generateForensicSeal(
  rawPayload: string,
  tenantId: string
): CryptographicSealResult {
  const timestamp = new Date().toISOString();
  
  const payloadToHash = `${rawPayload}|TENANT:${tenantId}|TS:${timestamp}`;
  
  const sha256Hash = createHash('sha256')
    .update(payloadToHash)
    .digest('hex');

  return {
    record_id: `SEAL-${Date.now()}`,
    sha256_hash: sha256Hash,
    timestamp: timestamp,
    is_valid: true,
  };
}

/**
 * Verifica si un hash entregado coincide exactamente con el payload original almacenado.
 */
export function verifyForensicSeal(
  rawPayload: string,
  tenantId: string,
  storedTimestamp: string,
  expectedHash: string
): boolean {
  const payloadToHash = `${rawPayload}|TENANT:${tenantId}|TS:${storedTimestamp}`;
  const computedHash = createHash('sha256')
    .update(payloadToHash)
    .digest('hex');

  return computedHash === expectedHash;
}