// apps/main-app/src/lib/osint/layer2/tlsResolver.ts

import tls from 'tls';

export interface SslCertificateData {
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  isValid: boolean;
  selfSigned: boolean;
}

export async function resolveSslCertificate(domain: string): Promise<SslCertificateData> {
  return new Promise((resolve) => {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const socket = tls.connect(
      {
        host: cleanDomain,
        port: 443,
        servername: cleanDomain,
        rejectUnauthorized: false, // Permitir inspección aunque esté vencido
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

          // Formatear issuer de manera segura para TS
          let issuerStr = 'Desconocido';
          if (cert.issuer) {
            if (typeof cert.issuer === 'string') {
              issuerStr = cert.issuer;
            } else {
              const rawO = cert.issuer.O || cert.issuer.CN;
              if (Array.isArray(rawO)) {
                issuerStr = rawO.join(' ');
              } else if (typeof rawO === 'string') {
                issuerStr = rawO;
              } else {
                issuerStr = 'Certificado Emitido por Entidad TLS';
              }
            }
          }

          const validToDate = cert.valid_to ? new Date(cert.valid_to) : null;
          const now = new Date();
          const daysRemaining = validToDate
            ? Math.ceil((validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          const isValid = socket.authorized && daysRemaining !== null && daysRemaining > 0;
          const selfSigned = cert.issuer && cert.subject ? cert.issuer.CN === cert.subject.CN : false;

          socket.destroy();
          return resolve({
            issuer: issuerStr,
            validFrom: cert.valid_from || null,
            validTo: cert.valid_to || null,
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