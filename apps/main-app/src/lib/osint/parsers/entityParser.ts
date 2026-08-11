// apps/main-app/src/lib/osint/parsers/entityParser.ts
import { ExtractedEntity } from '../forensics';

/**
 * Normaliza números telefónicos a formato E.164 e identifica banderas de VoIP/MVNO.
 */
export function parsePhoneEntity(rawPhone: string): ExtractedEntity | null {
  if (!rawPhone) return null;

  // Limpieza: remueve espacios, guiones y paréntesis
  let cleaned = rawPhone.replace(/[\s\-\(\)]/g, '');

  // Conversión de prefijo internacional '0086' a '+86'
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // Asegura el prefijo '+'
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  const isChinaNumber = cleaned.startsWith('+86');
  let isVoipOrVirtual = false;

  // Los rangos 195, 170 y 171 en China se asignan con frecuencia a operadores virtuales / telemercadeo
  if (isChinaNumber && (cleaned.startsWith('+86195') || cleaned.startsWith('+86170') || cleaned.startsWith('+86171'))) {
    isVoipOrVirtual = true;
  }

  return {
    vector: 'VECTOR_4_TELECOM_MSG',
    type: 'PHONE_NUMBER',
    rawValue: rawPhone,
    normalizedValue: cleaned,
    metadata: {
      country_code: isChinaNumber ? 'CN' : 'UNKNOWN',
      carrier_type: isVoipOrVirtual ? 'VOIP_VIRTUAL_MVNO' : 'MNO_STANDARD',
      flag_high_risk: isVoipOrVirtual
    },
    riskPoints: isVoipOrVirtual ? 20 : 5
  };
}

/**
 * Parsea correos electrónicos y extrae dominios / QQ IDs.
 */
export function parseEmailEntity(rawEmail: string): ExtractedEntity | null {
  if (!rawEmail || !rawEmail.includes('@')) return null;

  const normalized = rawEmail.trim().toLowerCase().replace(/['"]/g, '');
  const [localPart, domain] = normalized.split('@');

  const isQqMail = domain === 'qq.com';
  const isFreemail = ['qq.com', 'gmail.com', '163.com', 'hotmail.com', 'yahoo.com'].includes(domain);

  return {
    vector: 'VECTOR_3_DIGITAL_INFRA',
    type: 'EMAIL_ADDRESS',
    rawValue: rawEmail,
    normalizedValue: normalized,
    metadata: {
      domain: domain,
      is_freemail: isFreemail,
      qq_id: isQqMail ? localPart : null
    },
    riskPoints: isFreemail ? 25 : 0
  };
}

/**
 * Parsea y evalúa patrones en direcciones geoespaciales.
 */
export function parseGeospatialEntity(rawAddress: string): ExtractedEntity | null {
  if (!rawAddress) return null;

  const normalized = rawAddress.trim();
  const lower = normalized.toLowerCase();

  const isHotelPremises = lower.includes('hotel');
  const isOfficeBuilding = lower.includes('office building');

  let poiCategory = 'STANDARD_ADDRESS';
  if (isHotelPremises) poiCategory = 'HOTEL_ANNEX_OFFICE';

  return {
    vector: 'VECTOR_2_GEOSPATIAL',
    type: 'ADDRESS_STRING',
    rawValue: rawAddress,
    normalizedValue: normalized,
    metadata: {
      poi_category: poiCategory,
      is_hotel_premises: isHotelPremises,
      is_shared_office: isOfficeBuilding
    },
    riskPoints: isHotelPremises ? 15 : 0
  };
}