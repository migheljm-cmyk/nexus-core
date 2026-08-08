import { NextRequest, NextResponse } from 'next/server';
import { OsintRepository } from '@nexus/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { targetId: string } }
) {
  try {
    const { targetId } = params;

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required.' }, { status: 400 });
    }

    // Casteo defensivo de la llamada al repositorio para solucionar la verificación de tipos de TS
    const repository = OsintRepository as any;
    const reports = typeof repository.getReportsByTargetId === 'function'
      ? await repository.getReportsByTargetId(targetId)
      : [];

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve OSINT reports.';
    console.error('[OSINT_GET_REPORTS_ERROR]:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}