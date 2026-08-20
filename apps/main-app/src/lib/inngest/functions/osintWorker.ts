import { inngest } from '../client';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase para entorno de Servidor/Worker
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const processOsintInvestigation = inngest.createFunction(
  { 
    id: 'process-osint-investigation',
    name: 'Process OSINT Investigation',
    triggers: [{ event: 'osint/investigation.requested' }]
  },
  async ({ event, step }) => {
    const { investigationId, targetRfc, targetDomain, targetEmail, targetName, target } = event.data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // STEP 1: Notificar inicio
    await step.run('update-status-in-progress', async () => {
      console.log(`[OSINT WORKER] Iniciando rastreo multi-fuente para expediente: ${investigationId}`);
    });

    // STEP 2A: Módulo Fiscal / SAT Check
    const satFindings = await step.run('execute-sat-module', async () => {
      const rfcToSearch = targetRfc || (target?.targetType === 'RFC' ? target.value : null);
      const nameToSearch = targetName || target?.legalName;

      if (!rfcToSearch && !nameToSearch) return null;

      try {
        const response = await fetch(`${baseUrl}/api/osint/sat-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            investigationId,
            rfc: rfcToSearch,
            name: nameToSearch,
          }),
        });

        if (!response.ok) return { error: `SAT API returned status ${response.status}` };
        return await response.json();
      } catch (err) {
        console.error('[OSINT WORKER] Error invocando módulo SAT:', err);
        return { error: 'Failed to connect to SAT service' };
      }
    });

    // STEP 2B: Módulo Infraestructura Digital / Telecom
    const digitalFindings = await step.run('execute-digital-module', async () => {
      const domainToSearch = targetDomain || (target?.targetType === 'DOMAIN' ? target.value : null);
      const emailToSearch = targetEmail || (target?.targetType === 'EMAIL' ? target.value : null);

      if (!domainToSearch && !emailToSearch) return null;

      try {
        const response = await fetch(`${baseUrl}/api/osint/digital-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            investigationId,
            domain: domainToSearch,
            email: emailToSearch,
          }),
        });

        if (!response.ok) return { error: `Digital Check API returned status ${response.status}` };
        return await response.json();
      } catch (err) {
        console.error('[OSINT WORKER] Error invocando módulo Digital:', err);
        return { error: 'Failed to connect to Digital service' };
      }
    });

    // STEP 3: Persistencia en Supabase (`evidence_vault`)
    await step.run('persist-findings-to-supabase', async () => {
      const recordsToInsert = [];

      if (satFindings && !satFindings.error) {
        recordsToInsert.push({
          investigation_id: investigationId,
          source_module: 'SAT_69B_CHECK',
          evidence_type: 'TAX_COMPLIANCE_RECORD',
          raw_data: satFindings,
          coi_score_impact: satFindings.riskScore || 0,
          created_at: new Date().toISOString(),
        });
      }

      if (digitalFindings && !digitalFindings.error) {
        recordsToInsert.push({
          investigation_id: investigationId,
          source_module: 'DIGITAL_FOOTPRINT',
          evidence_type: 'DNS_WHOIS_TELECOM',
          raw_data: digitalFindings,
          coi_score_impact: digitalFindings.riskScore || 0,
          created_at: new Date().toISOString(),
        });
      }

      if (recordsToInsert.length > 0) {
        const { error } = await supabase
          .from('evidence_vault')
          .insert(recordsToInsert);

        if (error) {
          console.error('[OSINT WORKER] Error insertando en evidence_vault:', error);
          throw error;
        }
      }

      return { insertedCount: recordsToInsert.length };
    });

    return {
      success: true,
      investigationId,
      timestamp: new Date().toISOString(),
    };
  }
);