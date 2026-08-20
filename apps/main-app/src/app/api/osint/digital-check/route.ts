import { NextResponse } from 'next/server';
import { lookupRdapDomain, analyzeEmailReputation } from '../../../../lib/services/digitalEnrichmentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const email = searchParams.get('email');

    if (!domain && !email) {
      return NextResponse.json(
        { error: 'Proporcione al menos un parámetro: "domain" o "email".' },
        { status: 400 }
      );
    }

    let rdapData = null;
    let emailData = null;

    if (domain) {
      rdapData = await lookupRdapDomain(domain);
    }

    if (email) {
      emailData = analyzeEmailReputation(email);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        rdap: rdapData,
        emailAnalysis: emailData,
      },
    });
  } catch (error: any) {
    console.error('[API Digital Check Error]:', error);
    return NextResponse.json(
      { error: 'Error interno en enriquecimiento digital.', details: error.message },
      { status: 500 }
    );
  }
}