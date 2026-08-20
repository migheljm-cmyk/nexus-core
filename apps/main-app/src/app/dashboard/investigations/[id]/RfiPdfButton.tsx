'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import  RfiPdfReport  from '../../../../components/modules/RfiPdfReport';

// Helper para limpiar/normalizar acentos y caracteres de react-pdf
const sanitizePdfText = (text: string = ''): string => {
  if (!text) return '';
  return text
    // 1. Mapeo explícito de secuencias de encoding corrupto comunes
    .replace(/ýA/g, 'IA')
    .replace(/ýN/g, 'ON')
    .replace(/ýa/g, 'ia')
    .replace(/ýn/g, 'on')
    .replace(/ý/g, 'I')
    // 2. Normalización estándar y desacentuación segura
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
};

interface RfiPdfButtonProps {
  caseId: string;
  targetEntity: string;
}

export const RfiPdfButton: React.FC<RfiPdfButtonProps> = ({ caseId, targetEntity }) => {
  return (
    <PDFDownloadLink
      document={
        <RfiPdfReport
          caseId={caseId}
          targetEntity={targetEntity}
          />
        }

      fileName={`REQUERIMIENTO_EVIDENCIA_${caseId}.pdf`}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded border border-sky-500/30 transition-colors flex items-center gap-2"
        >
          {loading ? 'Generando RFI...' : '📄 Solicitar Evidencia (RFI)'}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default RfiPdfButton;