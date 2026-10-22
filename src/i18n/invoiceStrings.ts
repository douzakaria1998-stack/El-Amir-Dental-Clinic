import type { Lang } from '../types/invoice';

/**
 * Glossary of texts printed on the invoice (document language),
 * independent from the app UI language.
 */
export interface InvoiceStrings {
  title: string;
  billingDate: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  act: string;
  fees: string;
  amountSentence: string;
  tooth: (n: string) => string;
  continued: string;
  page: (i: number, n: number) => string;
}

export const invoiceStrings: Record<Lang, InvoiceStrings> = {
  fr: {
    title: 'FACTURE',
    billingDate: 'Date de facturation',
    lastName: 'Nom',
    firstName: 'Prénom',
    birthDate: 'Date de naissance',
    act: 'Acte',
    fees: 'Honoraires',
    amountSentence: 'Arrêté cette facture à la somme de :',
    tooth: (n) => `(Dent N° ${n})`,
    continued: '(suite)',
    page: (i, n) => `Page ${i}/${n}`,
  },
  en: {
    title: 'INVOICE',
    billingDate: 'Billing date',
    lastName: 'Last name',
    firstName: 'First name',
    birthDate: 'Date of birth',
    act: 'Procedure',
    fees: 'Fees',
    amountSentence: 'This invoice is hereby fixed at the sum of:',
    tooth: (n) => `(Tooth No. ${n})`,
    continued: '(continued)',
    page: (i, n) => `Page ${i}/${n}`,
  },
};
