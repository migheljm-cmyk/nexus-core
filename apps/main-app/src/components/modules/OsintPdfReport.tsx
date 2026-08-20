import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  Line,
  G,
} from '@react-pdf/renderer';

export interface EvidenceItem {
  id: string;
  timestamp: string;
  source: string;
  category: string;
  description: string;
  status: string;
}

export interface OsintReportData {
  caseId: string;
  summary: {
    targetName: string;
    targetTaxId: string;
    globalScore: number;
    riskScore: number;
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    verdict: string;
    keyFindings: string[];
    flagsCount: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    analyzedAt: string;
  };
  evidences: EvidenceItem[];
  hashSha256: string;
}

// Helper para limpiar emojis o caracteres no soportados por las fuentes estándar del PDF
const sanitizePdfText = (text: string = ''): string => {
  if (!text) return '';
  return text
    // Remover emojis y símbolos astronómicos/pictográficos que rompen react-pdf
    .replace(/[\u1F300-\u1F9FF]|[\u2600-\u26FF]|[\u2700-\u27BF]/g, '')
    // Reemplazar comillas tipográficas por estándar
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#020617', // Slate-950
    color: '#f8fafc',
    padding: 30,
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#10b981', // Emerald-500
    borderBottomStyle: 'solid',
    paddingBottom: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#34d399', // Emerald-400
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#7c2d12',
    color: '#fdba74',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    fontSize: 8,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 9,
    color: '#34d399',
    borderLeftWidth: 2,
    borderLeftColor: '#34d399',
    paddingLeft: 6,
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  gridTwoCols: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
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
    marginBottom: 5,
  },
  label: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 8,
    color: '#f8fafc',
    lineHeight: 1.2,
  },
  graphContainer: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  evidenceCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  evidenceId: {
    fontSize: 8,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  evidenceDate: {
    fontSize: 7,
    color: '#64748b',
  },
  evidenceDesc: {
    fontSize: 7.5,
    color: '#cbd5e1',
    lineHeight: 1.2,
    fontFamily: 'Helvetica',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
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
  disclaimer: {
    marginTop: 6,
    fontSize: 6,
    color: '#64748b',
    lineHeight: 1.2,
  },
});

export const OsintPdfReport: React.FC<{ data: OsintReportData }> = ({ data }) => {
  const { summary, evidences, hashSha256, caseId } = data;

  // Deduplicación en caliente de evidencias por descripción/contenido
  const uniqueEvidences = evidences.reduce<EvidenceItem[]>((acc, current) => {
    const x = acc.find((item) => item.description === current.description);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  return (
    <Document title={`OSINT_REPORT_${caseId}`}>
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO PERICIAL */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>NEXUS CORE // OSINT REPORT</Text>
            <Text style={styles.subtitle}>
              CASE ID: {caseId} | B2B DUE DILIGENCE AUDIT
            </Text>
          </View>
          <View>
            <Text style={styles.badge}>
              RISK LEVEL: {summary.overallRisk}
            </Text>
          </View>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <View style={styles.mainContent}>
          {/* 1. RESUMEN DEL OBJETIVO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Target & Executive Summary</Text>

            <View style={styles.gridTwoCols}>
              <View style={styles.card}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Target Entity</Text>
                  <Text style={styles.value}>{sanitizePdfText(summary.targetName)}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Primary Domain / Reg</Text>
                  <Text style={styles.value}>{sanitizePdfText(summary.targetTaxId)}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Risk Score / Global</Text>
                  <Text style={styles.value}>
                    {summary.riskScore} / 100 (Global: {summary.globalScore})
                  </Text>
                </View>
                <View>
                  <Text style={styles.label}>Timestamp ISO/UTC</Text>
                  <Text style={styles.value}>{summary.analyzedAt}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Audit Verdict</Text>
              <Text style={[styles.value, { color: '#e2e8f0', marginTop: 3 }]}>
                {sanitizePdfText(summary.verdict)}
              </Text>
            </View>
          </View>

          {/* 2. TOPOLOGÍA DE ENTIDADES (VECTORIAL SIN EMOJIS COMPATIBLE CON PDF) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Entity Network Topology</Text>
            <View style={styles.graphContainer}>
              <Svg width="480" height="120" viewBox="0 0 480 120">
                {/* Conectores Vectoriales */}
                <Line x1="240" y1="35" x2="90" y2="85" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" />
                <Line x1="240" y1="35" x2="240" y2="85" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" />
                <Line x1="240" y1="35" x2="390" y2="85" stroke="#e11d48" strokeWidth="1" strokeDasharray="3 3" />

                {/* Nodo Central - Target */}
                <G>
                  <Rect x="140" y="10" width="200" height="25" rx="4" fill="#020617" stroke="#10b981" strokeWidth="1.5" />
                  <Text x="240" y="26" fill="#34d399" style={{ fontSize: 8 }} textAnchor="middle">
                    {`[TARGET] ${sanitizePdfText(summary.targetName).slice(0, 24)}`}
                  </Text>
                </G>

                {/* Nodo Secundario 1 - Email / Comms */}
                <G>
                  <Rect x="20" y="85" width="140" height="22" rx="4" fill="#020617" stroke="#a855f7" strokeWidth="1" />
                  <Text x="90" y="99" fill="#c084fc" style={{ fontSize: 7 }} textAnchor="middle">
                    [MAIL] COMMUNICATIONS
                  </Text>
                </G>

                {/* Nodo Secundario 2 - Infraestructura / DNS */}
                <G>
                  <Rect x="180" y="85" width="120" height="22" rx="4" fill="#020617" stroke="#06b6d4" strokeWidth="1" />
                  <Text x="240" y="99" fill="#22d3ee" style={{ fontSize: 7 }} textAnchor="middle">
                    [DNS] INFRASTRUCTURE
                  </Text>
                </G>

                {/* Nodo Secundario 3 - Auditoría Fiscal / SAT */}
                <G>
                  <Rect x="320" y="85" width="140" height="22" rx="4" fill="#020617" stroke="#e11d48" strokeWidth="1" />
                  <Text x="390" y="99" fill="#f43f5e" style={{ fontSize: 7 }} textAnchor="middle">
                    [TAX] AUDIT 69-B / SAT
                  </Text>
                </G>
              </Svg>
            </View>
          </View>

          {/* 3. CADENA DE CUSTODIA Y EVIDENCIAS (DEDUPLICADAS Y SANITIZADAS) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              3. Evidence Audit Trail ({uniqueEvidences.length})
            </Text>
            {uniqueEvidences.map((ev) => (
              <View key={ev.id} style={styles.evidenceCard}>
                <View style={styles.evidenceHeader}>
                  <Text style={styles.evidenceId}>EVID: {ev.id}</Text>
                  <Text style={styles.evidenceDate}>{ev.timestamp}</Text>
                </View>
                <Text style={styles.evidenceDesc}>
                  {sanitizePdfText(ev.description)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* SELLO DE INTEGRIDAD PERICIAL */}
        <View style={styles.footer}>
          <View style={styles.hashBox}>
            <Text style={styles.label}>CRYPTOGRAPHIC PROOF (SHA-256 HASH)</Text>
            <Text style={styles.hashText}>{hashSha256}</Text>
          </View>
          <Text style={styles.disclaimer}>
            CONFIDENTIAL // NEXUS CORE DIGITAL FORENSICS. DISCLAIMER: THIS AUDIT REPORT IS GENERATED AUTOMATICALLY VIA OSINT INGESTION ENGINE. UNAUTHORIZED ALTERATION INVALIDATES THE SHA-256 STAMP.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default OsintPdfReport;