'use server';

import { inngest } from '../../lib/inngest/client';

export async function triggerOsintEnrichment(data: {
  investigationId: string;
  targetRfc?: string;
  targetDomain?: string;
  targetEmail?: string;
  targetName?: string;
}) {
  try {
    await inngest.send({
      name: 'osint/investigation.requested',
      data,
    });
    return { success: true };
  } catch (error) {
    console.error('Error al disparar Inngest desde Server Action:', error);
    return { success: false, error: 'No se pudo despachar el evento' };
  }
}