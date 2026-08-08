import { OsintRiskScore } from '@nexus/database';

export const OSINT_EVENT_TYPES = {
  REPORT_GENERATED: 'OSINT_REPORT_GENERATED',
} as const;

export interface OsintReportGeneratedPayload {
  reportId: string;
  targetId: string;
  organizationId: string;
  companyName: string;
  riskScore: OsintRiskScore;
  findingsCount: number;
  generatedAt: string; // ISO Date String
}

export interface OsintReportGeneratedEvent {
  type: typeof OSINT_EVENT_TYPES.REPORT_GENERATED;
  payload: OsintReportGeneratedPayload;
}