'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateInvestigationSchema,
  CreateInvestigationInput,
  TargetType,
} from '../../lib/validations/investigation';

interface NewInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (data: CreateInvestigationInput) => void;
}

export const NewInvestigationModal: React.FC<NewInvestigationModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
}) => {
  const [activeVector, setActiveVector] = useState<TargetType>('NACIONAL_MX');
  const [tagInput, setTagInput] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
} = useForm({
    resolver: zodResolver(CreateInvestigationSchema),
    defaultValues: {
      caseName: '',
      description: '',
      priority: 'MEDIUM',
      tags: [],
      target: {
      targetType: 'NACIONAL_MX',
      personType: 'MORAL',
      rfc: '',
      razonSocial: '',
      cedulaFiscalRef: '',
     },
    },
  });

  const currentTags = watch('tags') || [];
  const targetValues = watch('target');

  // Cambiar de vector reseteando el sub-objeto target con sus defaults correspondientes
  const handleVectorChange = (vector: TargetType) => {
    setActiveVector(vector);
    if (vector === 'NACIONAL_MX') {
      setValue('target', {
        targetType: 'NACIONAL_MX',
        personType: 'MORAL',
        rfc: '',
        razonSocial: '',
      });
    } else if (vector === 'INTERNACIONAL') {
      setValue('target', {
        targetType: 'INTERNACIONAL',
        legalName: '',
        countryCode: '',
        taxRegType: 'US_EIN',
        taxRegNumber: '',
      });
    } else if (vector === 'DIGITAL_TELECOM') {
      setValue('target', {
        targetType: 'DIGITAL_TELECOM',
        inputCategory: 'EMAIL',
        value: '',
      });
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (!currentTags.includes(newTag)) {
        setValue('tags', [...currentTags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      currentTags.filter((t) => t !== tagToRemove)
    );
  };

  const onFormSubmit = async (data: CreateInvestigationInput) => {
    setSubmitError(null);

    try {
      // Petición HTTP directa al Pipeline de Ingesta
      const response = await fetch('/api/v1/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Error en la respuesta del pipeline de ingesta.');
      }

      console.log('✅ Ingesta enviada correctamente:', result);

      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }

      reset();
      setActiveVector('NACIONAL_MX');
      onClose();

      // Refrescar el estado del dashboard para mostrar el nuevo expediente registrado
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error al ejecutar pipeline de ingesta:', error);
      setSubmitError(error?.message || 'Error de conexión con el servidor.');
    }
  };

  if (!isOpen) return null;

  // Helpers para extracción segura de errores del target discriminado
  const targetErrors = errors.target as Record<string, { message?: string }> | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-emerald-950/20 text-slate-100">
        
        {/* Header Cyber-Forense */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-mono font-bold tracking-tight text-emerald-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              NUEVO_OBJETIVO // INGESTA MULTI-VECTOR
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Alta de caso y vector primario para perfilamiento OSINT
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 font-mono text-sm px-2 py-1 rounded bg-slate-900 border border-slate-800"
          >
            [ESC / X]
          </button>
        </div>

        {submitError && (
          <div className="mb-4 p-3 rounded bg-rose-950/80 border border-rose-800/80 text-rose-300 font-mono text-xs">
            ⚠️ ERROR_INGESTA: {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          
          {/* Sección 1: Metadatos Generales del Caso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800/80">
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Nombre / Código del Caso *
              </label>
              <input
                {...register('caseName')}
                placeholder="Ej. OPERACION-FANSEN-2026"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
              {errors.caseName && (
                <p className="text-xs text-rose-500 mt-1 font-mono">{errors.caseName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Prioridad
              </label>
              <select
                {...register('priority')}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="LOW">BAJA</option>
                <option value="MEDIUM">MEDIA</option>
                <option value="HIGH">ALTA</option>
                <option value="CRITICAL">CRÍTICA (CRITICAL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Etiquetas / Tags (Presiona Enter)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Ej. fraud, china, e-commerce"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {currentTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sección 2: Selector de Vector Target */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
              Selecciona el Vector de Ingesta Principal
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleVectorChange('NACIONAL_MX')}
                className={`py-2 px-3 rounded text-xs font-mono font-bold border text-center transition-all ${
                  activeVector === 'NACIONAL_MX'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                🇲🇽 NACIONAL (MX)
              </button>
              <button
                type="button"
                onClick={() => handleVectorChange('INTERNACIONAL')}
                className={`py-2 px-3 rounded text-xs font-mono font-bold border text-center transition-all ${
                  activeVector === 'INTERNACIONAL'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                🌐 INTERNACIONAL
              </button>
              <button
                type="button"
                onClick={() => handleVectorChange('DIGITAL_TELECOM')}
                className={`py-2 px-3 rounded text-xs font-mono font-bold border text-center transition-all ${
                  activeVector === 'DIGITAL_TELECOM'
                    ? 'bg-purple-950/80 border-purple-500 text-purple-400 shadow-lg shadow-purple-950/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                📡 DIGITAL / TELECOM
              </button>
            </div>
          </div>

          {/* Sección 3: Campos Dinámicos según Vector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4">
            
            {/* VECTOR 1: NACIONAL (MX) */}
            {activeVector === 'NACIONAL_MX' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Tipo de Persona
                  </label>
                  <select
                    {...register('target.personType' as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="MORAL">PERSONA MORAL (EMPRESA)</option>
                    <option value="FISICA">PERSONA FÍSICA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    RFC con Homoclave *
                  </label>
                  <input
                    {...register('target.rfc' as any)}
                    placeholder="Ej. XAXX010101000"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                  {targetErrors?.rfc && (
                    <p className="text-xs text-rose-500 mt-1 font-mono">
                      {targetErrors.rfc.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Razón Social / Nombre Completo *
                  </label>
                  <input
                    {...register('target.razonSocial' as any)}
                    placeholder="Ej. INDUSTRIAS EJEMPLO S.A. DE C.V."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  {targetErrors?.razonSocial && (
                    <p className="text-xs text-rose-500 mt-1 font-mono">
                      {targetErrors.razonSocial.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* VECTOR 2: INTERNACIONAL */}
            {activeVector === 'INTERNACIONAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Legal Name / Entity Name *
                  </label>
                  <input
                    {...register('target.legalName' as any)}
                    placeholder="Ej. Hunan Fansen E-commerce Co., Ltd."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  {targetErrors?.legalName && (
                    <p className="text-xs text-rose-500 mt-1 font-mono">
                      {targetErrors.legalName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Country Code (ISO Alpha-2) *
                  </label>
                  <input
                    {...register('target.countryCode' as any)}
                    placeholder="Ej. CN, US, HK, UK"
                    maxLength={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                  />
                  {targetErrors?.countryCode && (
                    <p className="text-xs text-rose-500 mt-1 font-mono">
                      {targetErrors.countryCode.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Tipo de Registro Fiscal / Corporativo
                  </label>
                  <select
                    {...register('target.taxRegType' as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="CHINA_USCC">CHINA: USCC (Unified Social Credit Code)</option>
                    <option value="US_EIN">US: EIN (Employer Identification Number)</option>
                    <option value="UK_CRN">UK: CRN (Companies House Number)</option>
                    <option value="EU_VAT_NIF">EU: NIF / CIF / VAT Number</option>
                    <option value="BR_CNPJ">BR: CNPJ (Brasil)</option>
                    <option value="LEI">GLOBAL: LEI (Legal Entity Identifier)</option>
                    <option value="DUNS">GLOBAL: DUNS Number</option>
                    <option value="OTHER">OTRO / NO ESTANDARIZADO</option>
                  </select>
                </div>

                {targetValues?.targetType === 'INTERNACIONAL' && targetValues.taxRegType === 'OTHER' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                      Nombre del Registro Corporativo de Origen *
                    </label>
                    <input
                      {...register('target.customTaxRegistryName' as any)}
                      placeholder="Ej. Hong Kong Companies Registry"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    {targetErrors?.customTaxRegistryName && (
                      <p className="text-xs text-rose-500 mt-1 font-mono">
                        {targetErrors.customTaxRegistryName.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Número de Registro / Tax ID *
                  </label>
                  <input
                    {...register('target.taxRegNumber' as any)}
                    placeholder="Ej. 91430100MA4LXXXXX (18 caracteres para China USCC)"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                  />
                  {targetErrors?.taxRegNumber && (
                    <p className="text-xs text-rose-500 mt-1 font-mono">
                      {targetErrors.taxRegNumber.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* VECTOR 3: DIGITAL & TELECOM */}
            {activeVector === 'DIGITAL_TELECOM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Categoría del Input
                  </label>
                  <select
                    {...register('target.inputCategory' as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  >
                    <option value="EMAIL">CORREO ELECTRÓNICO</option>
                    <option value="PHONE">TELÉFONO (E.164)</option>
                    <option value="DOMAIN">DOMINIO (FDQN)</option>
                    <option value="IP">DIRECCIÓN IP (v4/v6)</option>
                    <option value="ASN">NÚMERO AS (ASN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Valor del Objetivo *
                  </label>
                  <input
                    {...register('target.value' as any)}
                    placeholder={
                      targetValues?.targetType === 'DIGITAL_TELECOM' && targetValues.inputCategory === 'PHONE'
                        ? '+529981234567'
                        : targetValues?.targetType === 'DIGITAL_TELECOM' && targetValues.inputCategory === 'DOMAIN'
                        ? 'fansen-tech.com'
                        : targetValues?.targetType === 'DIGITAL_TELECOM' && targetValues.inputCategory === 'IP'
                        ? '192.168.1.1'
                        : targetValues?.targetType === 'DIGITAL_TELECOM' && targetValues.inputCategory === 'ASN'
                        ? 'AS15169'
                        : 'ejemplo@domain.com'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  {targetErrors?.value && (
                    <p className="text-xs text-rose-500 mt-1 font-mono">
                      {targetErrors.value.message}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer & Acciones */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
            <span className="text-[10px] font-mono text-slate-500">
              SECURED_BY_SHA256 // NEXUS_CORE_OSINT_ENGINE
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 border border-slate-800 rounded bg-slate-900 disabled:opacity-50"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-md shadow-emerald-950/50 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'INGESTANDO...' : 'INICIALIZAR_INVESTIGACIÓN ➔'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};