import { z } from 'zod';

// ==========================================
// 1. ENUMS Y CONSTANTES
// ==========================================

export const TargetTypeEnum = z.enum([
  'NACIONAL_MX',
  'INTERNACIONAL',
  'DIGITAL_TELECOM',
]);

export type TargetType = z.infer<typeof TargetTypeEnum>;

// Catálogo ampliado de registros fiscales/corporativos internacionales
export const TaxRegTypeEnum = z.enum([
  'US_EIN',      // Employer Identification Number (EE. UU. - 9 dígitos)
  'US_CIK',      // Central Index Key (SEC EE. UU. - 10 dígitos)
  'UK_CRN',      // Companies House Registration Number (Reino Unido - 8 caracteres)
  'CHINA_USCC',  // Unified Social Credit Code (China - 18 caracteres alfanuméricos)
  'EU_VAT_NIF',  // NIF / CIF / VAT Number (Unión Europea)
  'BR_CNPJ',     // Cadastro Nacional da Pessoa Jurídica (Brasil)
  'DUNS',        // D-U-N-S Number (Dun & Bradstreet - 9 dígitos)
  'LEI',         // Legal Entity Identifier (Global - 20 caracteres alfanuméricos)
  'OTHER',       // Otro registro local / No estandarizado
]);

export type TaxRegType = z.infer<typeof TaxRegTypeEnum>;

// Regex para RFC México (Física 13 chars, Moral 12 chars)
const RFC_REGEX = /^([A-ZÑ&]{3,4})([0-9]{2})(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([A-Z0-9]{3})$/i;

// Regex para teléfono formato internacional E.164 (+1234567890)
const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// Regex para China USCC (Unified Social Credit Code - 18 dígitos/letras excluyendo I,O,Z,S,V)
const CHINA_USCC_REGEX = /^[0-9A-HJ-NP-RT-UW-Y]{18}$/i;

// Regex para US EIN (XX-XXXXXXX o XXXXXXXXX)
const US_EIN_REGEX = /^\d{2}-?\d{7}$/;

// Regex para Global LEI (20 caracteres alfanuméricos)
const LEI_REGEX = /^[A-Z0-9]{18}\d{2}$/i;

// Regex para DUNS Number (9 dígitos)
const DUNS_REGEX = /^\d{9}$/;

// ==========================================
// 2. SCHEMAS ESPECÍFICOS POR VECTOR
// ==========================================

// --- Vector 1: Nacional (México) ---
export const NacionalMxVectorSchema = z.object({
  targetType: z.literal(TargetTypeEnum.enum.NACIONAL_MX),
  personType: z.enum(['FISICA', 'MORAL']),
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(RFC_REGEX, { message: 'Formato de RFC inválido (debe incluir homoclave).' }),
  razonSocial: z.string().trim().min(2, 'La Razón Social o Nombre es obligatorio.'),
  cedulaFiscalRef: z.string().trim().optional(), // Archivo subido o ID de referencia SAT
});

// --- Vector 2: Internacional (Enriquecido) ---
export const InternacionalVectorSchema = z.object({
  targetType: z.literal(TargetTypeEnum.enum.INTERNACIONAL),
  legalName: z.string().trim().min(2, 'El nombre legal de la entidad/persona es requerido.'),
  countryCode: z
    .string()
    .length(2, 'Código de país en formato ISO Alpha-2 (ej. US, UK, CN, HK).')
    .toUpperCase(),
  taxRegType: TaxRegTypeEnum,
  taxRegNumber: z.string().trim().min(2, 'El número de registro fiscal o corporativo es requerido.'),
  customTaxRegistryName: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  const cleanNumber = data.taxRegNumber.replace(/[\s-]/g, '');

  if (data.taxRegType === 'CHINA_USCC') {
    if (!CHINA_USCC_REGEX.test(cleanNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formato de USCC chino inválido (18 caracteres alfanuméricos válidos).',
        path: ['taxRegNumber'],
      });
    }
  }

  if (data.taxRegType === 'US_EIN') {
    if (!US_EIN_REGEX.test(cleanNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formato de US EIN inválido (debe tener 9 dígitos, ej: 12-3456789).',
        path: ['taxRegNumber'],
      });
    }
  }

  if (data.taxRegType === 'LEI') {
    if (!LEI_REGEX.test(cleanNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formato LEI inválido (debe tener 20 caracteres alfanuméricos ISO 17442).',
        path: ['taxRegNumber'],
      });
    }
  }

  if (data.taxRegType === 'DUNS') {
    if (!DUNS_REGEX.test(cleanNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formato D-U-N-S inválido (debe tener exactamente 9 dígitos).',
        path: ['taxRegNumber'],
      });
    }
  }

  if (data.taxRegType === 'OTHER' && (!data.customTaxRegistryName || data.customTaxRegistryName.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Especifique el nombre del registro corporativo/fiscal de origen.',
      path: ['customTaxRegistryName'],
    });
  }
});

// --- Vector 3: Digital & Telecom ---
export const DigitalTelecomVectorSchema = z.object({
  targetType: z.literal(TargetTypeEnum.enum.DIGITAL_TELECOM),
  inputCategory: z.enum(['EMAIL', 'PHONE', 'DOMAIN', 'IP', 'ASN']),
  value: z.string().trim().min(1, 'El valor del objetivo digital es requerido.'),
}).superRefine((data, ctx) => {
  if (data.inputCategory === 'EMAIL') {
    const res = z.string().email().safeParse(data.value);
    if (!res.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dirección de correo electrónico no válida.',
        path: ['value'],
      });
    }
  }

  if (data.inputCategory === 'PHONE') {
    if (!E164_PHONE_REGEX.test(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formato telefónico inválido. Debe usar formato E.164 (ej. +529981234567).',
        path: ['value'],
      });
    }
  }

  if (data.inputCategory === 'DOMAIN') {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,}$/i;
    if (!domainRegex.test(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nombre de dominio no válido (ej. objetivo.com).',
        path: ['value'],
      });
    }
  }

  if (data.inputCategory === 'IP') {
    const isIPv4 = z.ipv4().safeParse(data.value).success;
    const isIPv6 = z.ipv6().safeParse(data.value).success;    if (!isIPv4 && !isIPv6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Dirección IP inválida (IPv4 o IPv6 requerida).',
        path: ['value'],
      });
    }
  }

  if (data.inputCategory === 'ASN') {
    const asnRegex = /^(AS|as)?[0-9]{1,10}$/;
    if (!asnRegex.test(data.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formato ASN inválido (ej. AS15169 o 15169).',
        path: ['value'],
      });
    }
  }
});

// ==========================================
// 3. SCHEMA UNIFICADO Y METADATOS DE INVESTIGACIÓN
// ==========================================

export const TargetVectorDiscriminatedSchema = z.discriminatedUnion('targetType', [
  NacionalMxVectorSchema,
  InternacionalVectorSchema,
  DigitalTelecomVectorSchema,
]);

export const CreateInvestigationSchema = z.object({
  caseName: z.string().trim().min(3, 'El nombre/código del caso debe tener al menos 3 caracteres.'),
  description: z.string().trim().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  
  target: TargetVectorDiscriminatedSchema,
});

// Tipos inferidos exportados
export type NacionalMxVector = z.infer<typeof NacionalMxVectorSchema>;
export type InternacionalVector = z.infer<typeof InternacionalVectorSchema>;
export type DigitalTelecomVector = z.infer<typeof DigitalTelecomVectorSchema>;
export type CreateInvestigationInput = z.infer<typeof CreateInvestigationSchema>;