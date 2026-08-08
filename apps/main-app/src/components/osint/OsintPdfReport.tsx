import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

export interface ExecutiveSummary {
  targetName: string;
  targetTaxId: string;
  globalScore: number;
  riskScore: number;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  verdict: string;
  keyFindings: string[];
  flagsCount: { critical: number; high: number; medium: number; low: number };
  analyzedAt: string;
}

export interface EvidenceEvent {
  id: string;
  timestamp: string;
  source: string;
  category: 'CORPORATE' | 'GEOLOCATION' | 'COMMUNICATION' | 'FINANCIAL';
  description: string;
  status: 'VERIFIED' | 'SUSPICIOUS' | 'UNVERIFIED';
}

export interface OsintReportData {
  caseId: string;
  summary: ExecutiveSummary;
  evidences: EvidenceEvent[];
  hashSha256: string;
}

// Estilos Cyber-Forensics Corregidos para evitar solapamientos
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#020617', // Slate-950
    color: '#f8fafc',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#10b981', // Emerald-500
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34d399', // Emerald-400
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 3,
  },
  badgeCritical: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeHigh: {
    backgroundColor: '#7c2d12',
    color: '#fdba74',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    fontSize: 8,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    color: '#34d399',
    borderLeftWidth: 2,
    borderLeftColor: '#34d399',
    paddingLeft: 6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  gridTwoCols: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate-900
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
    borderRadius: 4,
  },
  fieldGroup: {
    marginBottom: 6,
  },
  label: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    color: '#f8fafc',
    lineHeight: 1.2,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 4,
  },
  tableHeader: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    padding: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    padding: 6,
    alignItems: 'center',
  },
  colTimestamp: { width: '25%' },
  colCategory: { width: '20%' },
  colDescription: { width: '40%' },
  colStatus: { width: '15%' },

  th: {
    fontSize: 7,
    color: '#34d399',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  td: {
    fontSize: 7,
    color: '#cbd5e1',
    lineHeight: 1.2,
  },
  footer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  hashBox: {
    backgroundColor: '#090d16',
    padding: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  hashText: {
    fontSize: 7,
    color: '#10b981',
    fontFamily: 'Courier',
    marginTop: 2,
  },
});

export const OsintPdfReport: React.FC<{ data: OsintReportData }> = ({ data }) => {
  const { summary, evidences, caseId, hashSha256 } = data;

  return (
    <Document title={`OSINT_REPORT_${caseId}`}>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO DE DICTAMEN */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>NEXUS CORE // OSINT REPORT</Text>
            <Text style={styles.subtitle}>CASE ID: {caseId} | B2B DUE DILIGENCE AUDIT</Text>
          </View>
          <View>
            <Text
              style={
                summary.overallRisk === 'CRITICAL' || summary.overallRisk === 'HIGH'
                  ? styles.badgeCritical
                  : styles.badgeHigh
              }
            >
              RISK LEVEL: {summary.overallRisk}
            </Text>
          </View>
        </View>

        {/* RESUMEN EJECUTIVO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Target & Executive Summary</Text>
          
          <View style={styles.gridTwoCols}>
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Target Entity</Text>
                <Text style={styles.value}>{summary.targetName}</Text>
              </View>
              <View>
                <Text style={styles.label}>Tax ID / REG</Text>
                <Text style={styles.value}>{summary.targetTaxId}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Risk Score / Global</Text>
                <Text style={styles.value}>{summary.riskScore} / 100 (Global: {summary.globalScore})</Text>
              </View>
              <View>
                <Text style={styles.label}>Timestamp ISO/UTC</Text>
                <Text style={styles.value}>{summary.analyzedAt}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Audit Verdict</Text>
            <Text style={[styles.value, { color: '#e2e8f0', marginTop: 4 }]}>
              {summary.verdict}
            </Text>
          </View>
        </View>

        {/* TRAZA CRONOLÓGICA DE EVIDENCIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Evidence Audit Trail</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colTimestamp]}>TIMESTAMP</Text>
              <Text style={[styles.th, styles.colCategory]}>CATEGORY</Text>
              <Text style={[styles.th, styles.colDescription]}>DESCRIPTION</Text>
              <Text style={[styles.th, styles.colStatus]}>STATUS</Text>
            </View>
            {evidences.map((ev) => (
              <View key={ev.id} style={styles.tableRow}>
                <Text style={[styles.td, styles.colTimestamp]}>{ev.timestamp}</Text>
                <Text style={[styles.td, styles.colCategory]}>{ev.category}</Text>
                <Text style={[styles.td, styles.colDescription]}>{ev.description}</Text>
                <Text
                  style={[
                    styles.td,
                    styles.colStatus,
                    {
                      color: ev.status === 'VERIFIED' ? '#34d399' : '#f87171',
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  {ev.status}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* SELLO DE INTEGRIDAD Y DISCLAIMER LEGAL */}
        <View style={styles.footer}>
          <View style={styles.hashBox}>
            <Text style={styles.label}>CRYPTOGRAPHIC PROOF (SHA-256 HASH)</Text>
            <Text style={styles.hashText}>{hashSha256}</Text>
          </View>
          <Text style={[styles.subtitle, { marginTop: 6, fontSize: 6, lineHeight: 1.2 }]}>
            CONFIDENTIAL // NEXUS CORE DIGITAL FORENSICS. DISCLAIMER: THIS AUDIT REPORT IS GENERATED AUTOMATICALLY VIA OSINT INGESTION ENGINE. UNAUTHORIZED ALTERATION INVALIDATES THE SHA-256 STAMP.
          </Text>
        </View>
      </Page>
    </Document>
  );
};