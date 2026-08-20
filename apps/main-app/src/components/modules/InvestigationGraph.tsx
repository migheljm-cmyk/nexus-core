'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { createClient } from '../../lib/supabase/client';

interface InvestigationGraphProps {
  investigationId?: string;
  targetName?: string;
}

interface EntityRecord {
  id: string;
  investigation_id: string;
  entity_type: 'company' | 'person' | 'email' | 'domain' | 'ip' | 'rfc' | string;
  name?: string;
  label?: string;
  risk_score?: number;
  metadata?: Record<string, any>;
  source_entity_id?: string | null;
}

// Estilos Cyber OSINT según el tipo de entidad
function getNodeStyle(type: string, riskScore: number = 0) {
  const isHighRisk = riskScore > 70;

  if (isHighRisk) {
    return {
      background: '#020617',
      color: '#f87171',
      border: '1px solid #ef4444',
      borderRadius: '8px',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '11px',
      boxShadow: '0 0 12px rgba(239, 68, 68, 0.3)',
    };
  }

  switch (type?.toLowerCase()) {
    case 'target':
    case 'company':
      return {
        background: '#020617',
        color: '#34d399',
        border: '1px solid #10b981',
        borderRadius: '8px',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
      };
    case 'email':
      return {
        background: '#020617',
        color: '#c084fc',
        border: '1px solid #a855f7',
        borderRadius: '8px',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '11px',
      };
    case 'domain':
      return {
        background: '#020617',
        color: '#22d3ee',
        border: '1px solid #06b6d4',
        borderRadius: '8px',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '11px',
      };
    case 'ip':
      return {
        background: '#020617',
        color: '#f43f5e',
        border: '1px solid #e11d48',
        borderRadius: '8px',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '11px',
      };
    case 'rfc':
      return {
        background: '#020617',
        color: '#fbbf24',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '11px',
      };
    default:
      return {
        background: '#020617',
        color: '#cbd5e1',
        border: '1px solid #475569',
        borderRadius: '8px',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '11px',
      };
  }
}

function getEntityLabel(entity: Partial<EntityRecord>): string {
  const labelText = entity.name || entity.label || entity.id || 'Objetivo Desconocido';
  switch (entity.entity_type?.toLowerCase()) {
    case 'target':
    case 'company':
      return `🎯 Target: ${labelText}`;
    case 'email':
      return `✉️ Email: ${labelText}`;
    case 'domain':
      return `🌐 Domain: ${labelText}`;
    case 'ip':
      return `🖥️ IP: ${labelText}`;
    case 'rfc':
      return `🏛️ RFC: ${labelText}`;
    case 'person':
      return `👤 Persona: ${labelText}`;
    default:
      return `🔍 ${labelText}`;
  }
}

export const InvestigationGraph: React.FC<InvestigationGraphProps> = ({
  investigationId,
  targetName,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const supabase = useMemo(() => createClient(), []);

  // Función para construir el nodo raíz primario
  const createRootTargetNode = useCallback((name?: string, id?: string): Node => {
    const label = name ? `🎯 Target: ${name}` : '🎯 Target: En Proceso...';
    return {
      id: id ? `target-${id}` : 'root-target',
      type: 'default',
      data: { label },
      position: { x: 250, y: 150 },
      style: getNodeStyle('target', 0),
    };
  }, []);

  const fetchEntities = useCallback(async () => {
    if (!investigationId) {
      if (targetName) setNodes([createRootTargetNode(targetName)]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('investigation_id', investigationId);

      if (error) {
        console.error('Error al consultar entidades en Supabase:', error);
        setNodes([createRootTargetNode(targetName, investigationId)]);
        return;
      }

      if (data && data.length > 0) {
        const cols = 3;
        const spacingX = 250;
        const spacingY = 130;

        const dynamicNodes: Node[] = data.map((entity: EntityRecord, index: number) => {
          const row = Math.floor(index / cols);
          const col = index % cols;

          return {
            id: entity.id,
            type: 'default',
            data: { label: getEntityLabel(entity) },
            position: {
              x: entity.metadata?.x ?? col * spacingX + 150,
              y: entity.metadata?.y ?? row * spacingY + 60,
            },
            style: getNodeStyle(entity.entity_type, entity.risk_score),
          };
        });

        const dynamicEdges: Edge[] = [];
        data.forEach((entity: EntityRecord) => {
          if (entity.source_entity_id) {
            dynamicEdges.push({
              id: `e-${entity.source_entity_id}-${entity.id}`,
              source: entity.source_entity_id,
              target: entity.id,
              animated: true,
              style: { stroke: '#06b6d4', strokeWidth: 1.5 },
              label: entity.metadata?.relation_type || 'VÍNCULO',
              labelStyle: { fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' },
            });
          }
        });

        setNodes(dynamicNodes);
        setEdges(dynamicEdges);
      } else {
        // Fallback dinámico usando el objetivo del expediente actual
        setNodes([createRootTargetNode(targetName, investigationId)]);
        setEdges([]);
      }
    } catch (err) {
      console.error('Error en la construcción del grafo:', err);
      setNodes([createRootTargetNode(targetName, investigationId)]);
    } finally {
      setLoading(false);
    }
  }, [investigationId, targetName, supabase, setNodes, setEdges, createRootTargetNode]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-[550px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden relative">
      <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-center gap-2">
        <span>GRAPH_ANALYTICS // TOPOLOGÍA DE ENTIDADES</span>
        {loading && <span className="animate-pulse text-cyan-400">[CARGANDO_DATOS...]</span>}
        {targetName && <span className="text-slate-400">({targetName})</span>}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls className="bg-slate-900 border-slate-800 text-slate-200 fill-slate-200" />
        <MiniMap
          nodeColor="#1e293b"
          maskColor="rgba(2, 6, 23, 0.7)"
          className="bg-slate-950 border border-slate-800"
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
      </ReactFlow>
    </div>
  );
};