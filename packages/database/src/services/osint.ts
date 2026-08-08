import { createNexusClient } from '../client/supabase';
import type { 
  OsintTarget, 
  OsintEvidence, 
  OsintReport, 
  CreateOsintTargetInput, 
  CreateOsintEvidenceInput, 
  CreateOsintReportInput 
} from '../types/osint';

export class OsintRepository {
  // Usamos 'any' en el genérico interno del cliente para evitar que valide contra el schema.ts viejo
  constructor(private client: ReturnType<typeof createNexusClient> | any) {}

  // Targets
  async createTarget(input: CreateOsintTargetInput): Promise<OsintTarget> {
    const { data, error } = await (this.client
      .from('osint_targets') as any)
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`[OsintRepository] Error creating target: ${error.message}`);
    return data as OsintTarget;
  }

  async getTargetById(id: string): Promise<OsintTarget | null> {
    const { data, error } = await (this.client
      .from('osint_targets') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as OsintTarget;
  }

  // Evidence
  async addEvidence(input: CreateOsintEvidenceInput): Promise<OsintEvidence> {
    const { data, error } = await (this.client
      .from('osint_evidence') as any)
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`[OsintRepository] Error adding evidence: ${error.message}`);
    return data as OsintEvidence;
  }

  async getEvidenceByTarget(targetId: string): Promise<OsintEvidence[]> {
    const { data, error } = await (this.client
      .from('osint_evidence') as any)
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`[OsintRepository] Error fetching evidence: ${error.message}`);
    return data as OsintEvidence[];
  }

  // Reports
  async createReport(input: CreateOsintReportInput): Promise<OsintReport> {
    const { data, error } = await (this.client
      .from('osint_reports') as any)
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`[OsintRepository] Error creating report: ${error.message}`);
    
    // Actualizar el estado del objetivo a COMPLETED y asignar el score final
    await (this.client
      .from('osint_targets') as any)
      .update({ status: 'COMPLETED', risk_score: input.risk_score })
      .eq('id', input.target_id);

    return data as OsintReport;
  }
}