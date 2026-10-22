export type Lang = 'fr' | 'en';

export interface InvoiceAct {
  id: string;
  /** Key of a predefined act (Settings). When set, the act label follows the invoice language. */
  actKey?: string | null;
  /** Free text typed by the user (never auto-translated). Used when actKey is empty. */
  text: string;
  /** Optional tooth number(s), e.g. "31.45" → "(Dent N° 31.45)". */
  tooth: string;
  /** Fees in DA. */
  fee: number | null;
}

export interface Invoice {
  id: string;
  /** Internal sequential number, e.g. "2026-0001". Empty until first save. */
  number: string;
  invoiceLang: Lang;
  /** ISO dates (YYYY-MM-DD) or empty strings. */
  invoiceDate: string;
  billingDate: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  acts: InvoiceAct[];
  createdAt: string;
  updatedAt: string;
}
