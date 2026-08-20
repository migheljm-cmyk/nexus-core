// apps/main-app/src/lib/types/osintGraph.ts
import { Node, Edge } from '@xyflow/react';

export interface EntityRecord {
  id: string;
  investigation_id: string;
  entity_type: 'company' | 'person' | 'email' | 'domain' | 'rfc' | string;
  name: string;
  risk_score?: number;
  metadata?: Record<string, any>;
  source_entity_id?: string | null; // Para auto-generar bordes directos
}

export function transformEntitiesToGraph(entities: EntityRecord[]): {
  nodes: Node[];
  edges: Edge[];
} {
  // Configuración de disposición básica (grilla / radial simple si no hay coordenadas guardadas)
  const cols = 3;
  const spacingX = 220;
  const spacingY = 140;

  const nodes: Node[] = entities.map((entity, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      id: entity.id,
      type: 'default', // o tu tipo de nodo personalizado si creaste un CustomNode
      position: {
        x: entity.metadata?.x ?? col * spacingX + 50,
        y: entity.metadata?.y ?? row * spacingY + 50,
      },
      data: {
        label: entity.name,
        entityType: entity.entity_type,
        riskScore: entity.risk_score || 0,
        metadata: entity.metadata || {},
      },
      // Clases o estilos según el riesgo o tipo
      style: {
        background: entity.entity_type === 'rfc' ? '#fef2f2' : '#ffffff',
        border: entity.risk_score && entity.risk_score > 70 ? '2px solid #ef4444' : '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: '600',
      },
    };
  });

  const edges: Edge[] = [];

  // Construcción de conexiones basadas en rel-parents o conexiones explícitas
  entities.forEach((entity) => {
    if (entity.source_entity_id) {
      edges.push({
        id: `e-${entity.source_entity_id}-${entity.id}`,
        source: entity.source_entity_id,
        target: entity.id,
        animated: true,
        style: { stroke: '#64748b', strokeWidth: 2 },
      });
    }
  });

  return { nodes, edges };
}