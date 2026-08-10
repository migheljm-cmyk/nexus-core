// apps/main-app/src/lib/osint/layer2/tlsResolver.ts

import tls from 'node:tls';
import { SslCertData } from '../types';

/**
 * Inspecciona el certificado SSL/TLS activo en el puerto 443 del dominio
 */
export async function resolveSslCertificate(domain: string): Promise<SslCertData> {
  return new Promise((resolve) => {
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const socket = tls.connect(
      {
        host: cleanDomain,
        port: 443,
        servername: cleanDomain,
        rejectUnauthorized: false, // Permite inspeccionar incluso certificados vencidos o autofirmados
        timeout: 5000,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();

          if (!cert || Object.keys(cert).length === 0) {
            socket.destroy();
            return resolve({
              issuer: null,
              validFrom: null,
              validTo: null,
              daysRemaining: null,
              isValid: false,
              selfSigned: false,
            });
          }

          const validFrom = cert.valid_from ? new Date(cert.valid_from).toISOString() : null;
          const validTo = cert.valid_to ? new Date(cert.valid_to).toISOString() : null;

          let daysRemaining: number | null = null;
          if (validTo) {
            const diffMs = new Date(validTo).getTime() - Date.now();
            daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          }

          const issuer = typeof cert.issuer === 'object' ? cert.issuer.O || cert.issuer.CN || null : String(cert.issuer);
          const subject = typeof cert.subject === 'object' ? cert.subject.O || cert.subject.CN || null : String(cert.subject);

          const selfSigned = issuer === subject && issuer !== null;
          const isValid = socket.authorized && (daysRemaining === null || daysRemaining > 0);

          socket.destroy();
          return resolve({
            issuer,
            validFrom,
            validTo,
            daysRemaining,
            isValid,
            selfSigned,
          });
        } catch {
          socket.destroy();
          return resolve({
            issuer: null,
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            isValid: false,
            selfSigned: false,
          });
        }
      }
    );

    socket.on('error', () => {
      socket.destroy();
      return resolve({
        issuer: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        isValid: false,
        selfSigned: false,
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      return resolve({
        issuer: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        isValid: false,
        selfSigned: false,
      });
    });
  });
}