import { webcrypto } from 'node:crypto';

export async function generatePayloadHash(payload: unknown): Promise<string> {
  const jsonString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}