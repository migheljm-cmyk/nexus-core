'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Importaciones con rutas relativas
import { NewInvestigationModal } from '../../components/modules/NewInvestigationModal';
import { CreateInvestigationInput } from '../../lib/validations/investigation';

interface DashboardHeaderActionsProps {
  tenantId: string;
}

export const DashboardHeaderActions: React.FC<DashboardHeaderActionsProps> = ({ tenantId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleInvestigationCreated = async (createdData: any) => {
    console.log('NUEVO OBJETIVO INGESTADO:', createdData);
    
    // 1. Cerrar la modal inmediatamente para dar feedback de éxito
    setIsModalOpen(false);

    // 2. Invalidar la caché de Server Components para actualizar el Dashboard
    router.refresh();

    // 3. Extraer el ID si la respuesta/modal lo retorna
    const newId = createdData?.id || createdData?.investigationId || createdData?.investigation?.id;

    if (newId) {
      // Redirección directa al expediente recién creado
      router.push(`/dashboard/investigations/${newId}`);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-400">
        TENANT: <span className="text-slate-200">{tenantId ? tenantId.slice(0, 8) : '00000000'}...</span>
      </div>

      <button
        onClick={handleOpenModal}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-lg shadow-emerald-950/40 transition-all border border-emerald-300"
      >
        <span className="text-base leading-none">+</span> NUEVA_INVESTIGACIÓN
      </button>

      <NewInvestigationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmitSuccess={handleInvestigationCreated}
      />
    </div>
  );
};