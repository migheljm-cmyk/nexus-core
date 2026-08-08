import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { OsintPdfReport, OsintReportData } from '../../../../components/osint/OsintPdfReport';

// Configuración requerida para @react-pdf/renderer en Next.js App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const reportData: OsintReportData = await req.json();

    if (!reportData || !reportData.summary) {
      return NextResponse.json({ error: 'Payload de reporte no válido.' }, { status: 400 });
    }

    // Solución de tipos: Se castea la creación del elemento a React.ReactElement 
    // para cumplir con los requisitos de tipo de @react-pdf/renderer
    const pdfElement = React.createElement(OsintPdfReport, { data: reportData }) as React.ReactElement;

    // Renderizado en Stream PDF
    const stream = await renderToStream(pdfElement);

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OSINT_Audit_${reportData.caseId}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Fallo en la generación del PDF';
    console.error('[PDF_EXPORT_ERROR]:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}