'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface ExportPdfButtonProps {
  investigationId: string;
}

export default function ExportPdfButton({ investigationId }: ExportPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch(`/api/investigations/${investigationId}/export-pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!response.ok) throw new Error('Error al compilar el expediente PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EXPEDIENTE_NEXUS_${investigationId.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[PDF_EXPORT_ERROR]:', error);
      alert('Error al generar el PDF del expediente pericial.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Compilando Expediente...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Exportar Dictamen PDF
        </>
      )}
    </button>
  );
}