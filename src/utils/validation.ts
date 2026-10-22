import type { Invoice } from '../types/invoice';
import { isEmptyAct } from './acts';

/** Error codes are i18n keys under "validation.*". */
export interface ValidationErrors {
  invoiceDate?: string;
  billingDate?: string;
  lastName?: string;
  firstName?: string;
  birthDate?: string;
  acts?: string;
  /** Per-row errors, keyed by act id. */
  rows: Record<string, { text?: string; fee?: string }>;
}

const isValidIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime());

export function validateInvoice(inv: Invoice): ValidationErrors {
  const errors: ValidationErrors = { rows: {} };

  if (!inv.invoiceDate) errors.invoiceDate = 'required';
  else if (!isValidIso(inv.invoiceDate)) errors.invoiceDate = 'invalidDate';

  if (!inv.billingDate) errors.billingDate = 'required';
  else if (!isValidIso(inv.billingDate)) errors.billingDate = 'invalidDate';

  if (!inv.birthDate) errors.birthDate = 'required';
  else if (!isValidIso(inv.birthDate)) errors.birthDate = 'invalidDate';
  else if (inv.invoiceDate && isValidIso(inv.invoiceDate) && inv.birthDate > inv.invoiceDate) errors.birthDate = 'birthAfterInvoice';

  if (!inv.lastName.trim()) errors.lastName = 'required';
  if (!inv.firstName.trim()) errors.firstName = 'required';

  let validRows = 0;
  for (const act of inv.acts) {
    if (isEmptyAct(act)) continue;
    const rowErr: { text?: string; fee?: string } = {};
    if (!act.actKey && !act.text.trim()) rowErr.text = 'actRequired';
    if (act.fee === null || !Number.isFinite(act.fee) || act.fee <= 0) rowErr.fee = 'feePositive';
    if (rowErr.text || rowErr.fee) errors.rows[act.id] = rowErr;
    else validRows++;
  }
  if (validRows === 0 && Object.keys(errors.rows).length === 0) errors.acts = 'atLeastOneAct';

  return errors;
}

export function hasErrors(e: ValidationErrors): boolean {
  return Boolean(
    e.invoiceDate || e.billingDate || e.lastName || e.firstName || e.birthDate || e.acts || Object.keys(e.rows).length,
  );
}
