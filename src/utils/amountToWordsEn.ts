/**
 * Converts an amount (Algerian dinars) to English words.
 *
 * Style (kept consistent everywhere):
 *  - hyphenate 21–99 ("twenty-one", "ninety-nine")
 *  - no "and" between hundreds and tens ("one hundred twenty-five")
 *  - always "one hundred", "one thousand", "one million"
 *  - zero; optional centimes appended as "and X centime(s)"
 *
 * Output: first letter capitalised, followed by " DA".
 */

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const SCALES: [number, string][] = [
  [1_000_000_000, 'billion'],
  [1_000_000, 'million'],
  [1000, 'thousand'],
];

/** 0 < n < 100 */
function below100(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? TENS[t] : `${TENS[t]}-${ONES[u]}`;
}

/** 0 < n < 1000 */
function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(`${ONES[h]} hundred`);
  if (r > 0) parts.push(below100(r));
  return parts.join(' ');
}

/** Integer part (n >= 0) in words, lower case. */
export function integerToWordsEn(n: number): string {
  if (!Number.isFinite(n) || n < 0) throw new RangeError('Amount must be a positive number');
  n = Math.floor(n);
  if (n === 0) return ONES[0];

  const parts: string[] = [];
  let rest = n;
  for (const [value, name] of SCALES) {
    const count = Math.floor(rest / value);
    if (count > 0) {
      parts.push(`${value === 1_000_000_000 ? integerToWordsEn(count) : below1000(count)} ${name}`);
      rest %= value;
    }
  }
  if (rest > 0) parts.push(below1000(rest));
  return parts.join(' ');
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * amountToWordsEn(6000)    → "Six thousand DA"
 * amountToWordsEn(6000.5)  → "Six thousand DA and fifty centimes"
 */
export function amountToWordsEn(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError('Amount must be a positive number');
  const totalCents = Math.round(amount * 100);
  const integer = Math.floor(totalCents / 100);
  const cents = totalCents % 100;

  let out = `${capitalize(integerToWordsEn(integer))} DA`;
  if (cents > 0) {
    out += ` and ${integerToWordsEn(cents)} ${cents === 1 ? 'centime' : 'centimes'}`;
  }
  return out;
}
