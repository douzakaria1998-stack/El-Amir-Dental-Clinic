import type { ThousandsSeparator } from '../types/settings';

/** "2026-06-20" → "20/06/2026" (always DD/MM/YYYY, whatever the language). */
export function formatDateDMY(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Today as ISO "YYYY-MM-DD" in local time. */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const SEPARATORS: Record<ThousandsSeparator, string> = {
  none: '',
  space: '\u00A0', // non-breaking space → "12 500 DA" never wraps
  dot: '.',
};

/** 6000 → "6000", 12500 → "12 500" (space) — decimals shown with a comma only when present. */
export function formatNumber(value: number, sep: ThousandsSeparator = 'none'): string {
  const totalCents = Math.round((Number.isFinite(value) ? value : 0) * 100);
  const negative = totalCents < 0;
  const abs = Math.abs(totalCents);
  const integer = Math.floor(abs / 100).toString();
  const cents = abs % 100;
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, SEPARATORS[sep]);
  const decimals = cents > 0 ? `,${String(cents).padStart(2, '0')}` : '';
  return `${negative ? '-' : ''}${grouped}${decimals}`;
}

/** 6000 → "6000 DA" */
export function formatAmount(value: number, sep: ThousandsSeparator = 'none'): string {
  return `${formatNumber(value, sep)}\u00A0DA`;
}

/** Sum of the fees; ignores empty values. */
export function sumFees(fees: (number | null | undefined)[]): number {
  const cents = fees.reduce<number>((acc, f) => acc + (typeof f === 'number' && Number.isFinite(f) ? Math.round(f * 100) : 0), 0);
  return cents / 100;
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
