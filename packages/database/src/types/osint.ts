export type OsintRiskScore = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'PENDING';
export type OsintTargetStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type OsintEvidenceCategory = 
  | 'CORPORATE_IDENTITY' 
  | 'GEOGRAPHIC' 
  | 'COMMUNICATIONS' 
  | 'FINANCIAL' 
  | 'LEGAL';

export interface OsintTarget {
  id: string;
  organization_id: string;
  company_name: string;
  tax_id?: string | null;
  legal_address?: string | null;
  website?: string | null;
  risk_score: OsintRiskScore;
  status: OsintTargetStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OsintEvidence<TData = Record<string, unknown>> {
  id: string;
  target_id: string;
  category: OsintEvidenceCategory;
  source_type: string;
  data: TData;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface OsintFinding {
  id: string;
  title: string;
  severity: OsintRiskScore;
  category: OsintEvidenceCategory;
  description: string;
  evidence_ref_ids?: string[];
}

export interface OsintReport {
  id: string;
  target_id: string;
  executive_summary: string;
  matrix_findings: OsintFinding[];
  recommendations?: string | null;
  risk_score: OsintRiskScore;
  generated_pdf_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// DTOs para Inserción / Actualización
export type CreateOsintTargetInput = Omit<OsintTarget, 'id' | 'risk_score' | 'status' | 'created_at' | 'updated_at'>;
export type CreateOsintEvidenceInput = Omit<OsintEvidence, 'id' | 'created_at'>;
export type CreateOsintReportInput = Omit<OsintReport, 'id' | 'created_at' | 'updated_at'>;