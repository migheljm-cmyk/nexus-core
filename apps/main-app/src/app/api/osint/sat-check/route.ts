import { NextResponse } from 'next/server';
// Importación relativa directa a la carpeta lib de la app
import { checkSat69B } from '../../../../lib/services/sat69bService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rfc = searchParams.get('rfc');

    if (!rfc) {
      return NextResponse.json(
        { error: 'El parámetro "rfc" es obligatorio en la consulta.' },
        { status: 400 }
      );
    }

    // Ejecución del conector SAT 69-B
    const result = await checkSat69B(rfc);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error: any) {
    console.error('[API SAT Check Error]:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la verificación del SAT.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rfc } = body;

    if (!rfc) {
      return NextResponse.json(
        { error: 'El campo "rfc" es obligatorio en el payload.' },
        { status: 400 }
      );
    }

    const result = await checkSat69B(rfc);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error: any) {
    console.error('[API SAT Check Error]:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar la verificación del SAT.', details: error.message },
      { status: 500 }
    );
  }
}