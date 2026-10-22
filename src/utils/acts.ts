import type { Invoice, InvoiceAct, Lang } from '../types/invoice';
import type { ClinicSettings } from '../types/settings';
import { invoiceStrings } from '../i18n/invoiceStrings';

/** Label of an act in the given invoice language (predefined acts are translated, free text never). */
export function actLabel(act: InvoiceAct, lang: Lang, settings: ClinicSettings): string {
  let base = act.text.trim();
  if (act.actKey) {
    const def = settings.acts.find((a) => a.id === act.actKey);
    if (def) base = (lang === 'en' ? def.en : def.fr) || base;
  }
  const tooth = act.tooth.trim();
  if (!tooth) return base;
  return `${base} ${invoiceStrings[lang].tooth(tooth)}`.trim();
}

export function isEmptyAct(act: InvoiceAct): boolean {
  return !act.actKey && !act.text.trim() && !act.tooth.trim() && (act.fee === null || act.fee === 0);
}

/** Rows that will actually be printed (fully empty rows are ignored). */
export function printableActs(inv: Invoice): InvoiceAct[] {
  return inv.acts.filter((a) => !isEmptyAct(a));
}
