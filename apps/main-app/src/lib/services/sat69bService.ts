import { createClient } from '@supabase/supabase-js';

// Estructura de resultado para la verificación del SAT 69-B
export type Sat69Status = 'DEFINITIVO' | 'PRESUNTO' | 'DESAGREGADO' | 'SENTENCIA_FAVORABLE' | 'CLEAN';

export interface Sat69BResult {
  rfc: string;
  isEfo: boolean;
  status: Sat69Status;
  publicationDate?: string;
  dofPublicationDate?: string;
  details?: {
    razonSocial?: string;
    oficioNum?: string;
    montoOperaciones?: number;
  };
  riskContribution: number; // Impacto en el COI Score (0 a 100)
}

// Inicialización del cliente Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Servicio de Inteligencia Fiscal - Cruce contra listas del Art. 69-B del CFF
 */
export async function checkSat69B(rfc: string): Promise<Sat69BResult> {
  const cleanRfc = rfc.trim().toUpperCase();

  try {
    // 1. Consulta a la tabla local/sincronizada de EFOS en Supabase
    const { data: efoRecord, error } = await supabaseAdmin
      .from('sat_efos_list')
      .select('*')
      .eq('rfc', cleanRfc)
      .maybeSingle();

    if (error) {
      console.error('[SAT 69-B Service Error]:', error.message);
    }

    // 2. Si existe un registro en la lista de EFOS
    if (efoRecord) {
      const status = (efoRecord.situacion || 'PRESUNTO').toUpperCase() as Sat69Status;
      
      // Cálculo de contribución al Score de Riesgo (COI)
      let riskScore = 0;
      switch (status) {
        case 'DEFINITIVO':
          riskScore = 100; // Riesgo Crítico Directo
          break;
        case 'PRESUNTO':
          riskScore = 75;  // Riesgo Alto
          break;
        case 'SENTENCIA_FAVORABLE':
        case 'DESAGREGADO':
          riskScore = 20;  // Riesgo Bajo/Histórico
          break;
        default:
          riskScore = 50;
      }

      return {
        rfc: cleanRfc,
        isEfo: status === 'DEFINITIVO' || status === 'PRESUNTO',
        status,
        publicationDate: efoRecord.fecha_publicacion,
        dofPublicationDate: efoRecord.fecha_dof,
        details: {
          razonSocial: efoRecord.razon_social,
          oficioNum: efoRecord.num_oficio,
        },
        riskContribution: riskScore,
      };
    }

    // 3. Si el RFC no figura en las listas negras del SAT
    return {
      rfc: cleanRfc,
      isEfo: false,
      status: 'CLEAN',
      riskContribution: 0,
    };

  } catch (err) {
    console.error('[SAT 69-B Execution Exception]:', err);
    return {
      rfc: cleanRfc,
      isEfo: false,
      status: 'CLEAN',
      riskContribution: 0,
    };
  }
}