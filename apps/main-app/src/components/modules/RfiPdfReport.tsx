'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface RfiPdfReportProps {
  caseId: string;
  targetEntity?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  section: {
    margin: 10,
    padding: 10,
    backgroundColor: '#1e293b',
    borderRadius: 4,
  },
  title: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    color: '#e2e8f0',
  },
});

export default function RfiPdfReport({ caseId, targetEntity }: RfiPdfReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>SOLICITUD DE INFORMACIÓN (RFI)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>ID DE EXPEDIENTE</Text>
          <Text style={styles.text}>{caseId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>ENTIDAD / OBJETIVO OBJETIVO</Text>
          <Text style={styles.text}>{targetEntity || 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>ESTADO</Text>
          <Text style={styles.text}>Documento Pericial RFI Generado Automáticamente</Text>
        </View>
      </Page>
    </Document>
  );
}