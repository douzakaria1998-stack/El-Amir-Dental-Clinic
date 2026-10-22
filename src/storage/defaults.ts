import type { ClinicSettings } from '../types/settings';
import type { Invoice } from '../types/invoice';
import { todayIso } from '../utils/format';

/** Initial clinic settings (all editable in the Settings page). */
export const DEFAULT_SETTINGS: ClinicSettings = {
  clinicNameFr: 'Dr. Medjouel Yahia Amir',
  clinicTaglineFr: 'Dental Implantology and\nAesthetic Dentistry\nErrimel - El Oued\nBAT: 08/39/1801',
  clinicNameAr: 'الدكتور مجوّل يحي أمير',
  clinicTaglineAr: 'طب، زراعة وتجميل الأسنان\nحي الرمال - الوادي\nبالقرب من المحكمة',
  logoDataUrl: null,
  logoPosition: 'center',

  rc: '',
  nis: '',
  nif: '',

  address: 'Hai Errimel - El Oued',
  addressAr: 'حي الرمال - الوادي، بالقرب من المحكمة',
  phones: '0777 77 53 77 | 0652 69 59 69',
  email: '',
  website: '',

  vatEnabled: true,
  vatMention: { fr: 'Non assujetti à la TVA.', en: 'Not subject to VAT.' },
  footerText: { fr: '', en: '' },

  footerStyle: 'blue',
  showBackgroundPattern: true,
  backgroundPatternColor: 'blue',
  showWatermark: true,

  acts: [
    { id: 'consultation', fr: 'Consultation', en: 'Consultation', defaultFee: null },
    { id: 'extraction', fr: 'Extraction', en: 'Extraction', defaultFee: null },
    { id: 'scaling', fr: 'Détartrage', en: 'Scaling', defaultFee: null },
    { id: 'composite', fr: 'Obturation composite', en: 'Composite filling', defaultFee: null },
    { id: 'rootcanal', fr: 'Traitement canalaire', en: 'Root canal treatment', defaultFee: null },
    { id: 'pulpotomy', fr: 'Pulpotomie', en: 'Pulpotomy', defaultFee: null },
    { id: 'crown', fr: 'Couronne', en: 'Crown', defaultFee: null },
    { id: 'prosthesis', fr: 'Prothèse', en: 'Prosthesis', defaultFee: null },
    { id: 'implant', fr: 'Implant dentaire', en: 'Dental implant', defaultFee: null },
    { id: 'whitening', fr: 'Blanchiment', en: 'Teeth whitening', defaultFee: null },
    { id: 'panoramic', fr: 'Radiographie panoramique', en: 'Panoramic X-ray', defaultFee: null },
    { id: 'retroalveolar', fr: 'Radiographie rétro-alvéolaire', en: 'Periapical X-ray', defaultFee: null },
  ],

  thousandsSeparator: 'none',

  saveMethod: 'dialog',
  saveFolderName: '',

  defaultInvoiceLang: 'fr',
  defaultAppLang: 'fr',
};

/** Sample invoice reproduced from the reference (Image 1). */
export function createDemoInvoice(): Invoice {
  const now = new Date().toISOString();
  return {
    id: 'draft',
    number: '',
    invoiceLang: 'fr',
    invoiceDate: '2026-06-20',
    billingDate: '2026-06-16',
    lastName: 'REZZAG HABLA',
    firstName: 'EL AMINE',
    birthDate: '1949-03-20',
    acts: [{ id: 'demo-act-1', actKey: null, text: 'EXO', tooth: '31.45', fee: 6000 }],
    createdAt: now,
    updatedAt: now,
  };
}

export function createBlankInvoice(invoiceLang: Invoice['invoiceLang']): Invoice {
  const now = new Date().toISOString();
  const today = todayIso();
  return {
    id: 'draft',
    number: '',
    invoiceLang,
    invoiceDate: today,
    billingDate: today,
    lastName: '',
    firstName: '',
    birthDate: '',
    acts: [{ id: `act-${Date.now()}`, actKey: null, text: '', tooth: '', fee: null }],
    createdAt: now,
    updatedAt: now,
  };
}
