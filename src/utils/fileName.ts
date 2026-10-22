import type { Invoice } from '../types/invoice';

/** Removes characters that are not allowed in Windows/macOS file names. */
function safePart(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    || 'X';
}

/**
 * French  → "Facture_REZZAG-HABLA_EL-AMINE_20-06-2026.pdf"
 * English → "Invoice_REZZAG-HABLA_EL-AMINE_20-06-2026.pdf"
 */
export function invoiceFileName(inv: Pick<Invoice, 'invoiceLang' | 'lastName' | 'firstName' | 'invoiceDate'>): string {
  const prefix = inv.invoiceLang === 'en' ? 'Invoice' : 'Facture';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(inv.invoiceDate || '');
  const date = m ? `${m[3]}-${m[2]}-${m[1]}` : 'sans-date';
  return `${prefix}_${safePart(inv.lastName)}_${safePart(inv.firstName)}_${date}.pdf`;
}
