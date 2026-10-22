/**
 * Converts an amount (Algerian dinars) to French words, standard French
 * (France) rules — NOT Belgian/Swiss (no "septante", "huitante", "nonante").
 *
 * Rules implemented:
 *  - 70 = soixante-dix, 80 = quatre-vingts, 90 = quatre-vingt-dix
 *  - hyphens between all words < 100, except around "et"
 *    (21, 31, 41, 51, 61, 71 use "et"; 81 and 91 do not)
 *  - "quatre-vingts" / "deux cents" take an "s" only when not followed by
 *    another number word ("mille" counts as a following number word;
 *    "million(s)" / "milliard(s)" are nouns and do not)
 *  - "cent" and "mille" alone (never "un cent", "un mille"); "mille" invariable
 *  - "million(s)" / "milliard(s)" pluralised
 *  - zéro; optional centimes appended as "et X centime(s)"
 *
 * Output: first letter capitalised, followed by " DA".
 */

const UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
];

const TENS: Record<number, string> = {
  2: 'vingt',
  3: 'trente',
  4: 'quarante',
  5: 'cinquante',
  6: 'soixante',
};

/** 0 < n < 20 */
function below20(n: number): string {
  if (n < 17) return UNITS[n];
  return `dix-${UNITS[n - 10]}`;
}

/**
 * 0 < n < 100.
 * @param final true when no other number word follows (controls "quatre-vingts").
 */
function below100(n: number, final: boolean): string {
  if (n < 20) return below20(n);

  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return TENS[t];
    if (u === 1) return `${TENS[t]} et un`;
    return `${TENS[t]}-${UNITS[u]}`;
  }

  if (n < 80) {
    // 70–79 : soixante-dix, soixante et onze, soixante-douze …
    const r = n - 60;
    if (r === 11) return 'soixante et onze';
    return `soixante-${below20(r)}`;
  }

  // 80–99
  const r = n - 80;
  if (r === 0) return final ? 'quatre-vingts' : 'quatre-vingt';
  return `quatre-vingt-${below20(r)}`;
}

/**
 * 0 < n < 1000.
 * @param final true when no other number word follows this group.
 */
function below1000(n: number, final: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];

  if (h === 1) {
    parts.push('cent');
  } else if (h > 1) {
    parts.push(`${UNITS[h]} ${r === 0 && final ? 'cents' : 'cent'}`);
  }
  if (r > 0) parts.push(below100(r, final));
  return parts.join(' ');
}

/** Integer part (n >= 0) in words, lower case. */
export function integerToWordsFr(n: number): string {
  if (!Number.isFinite(n) || n < 0) throw new RangeError('Amount must be a positive number');
  n = Math.floor(n);
  if (n === 0) return UNITS[0];

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];

  if (billions > 0) {
    // "milliard" is a noun → preceding cent/vingt keep their "s"
    parts.push(billions === 1 ? 'un milliard' : `${integerToWordsFr(billions)} milliards`);
  }
  if (millions > 0) {
    parts.push(millions === 1 ? 'un million' : `${below1000(millions, true)} millions`);
  }
  if (thousands > 0) {
    // "mille" is an invariable numeral adjective → "quatre-vingt mille", "deux cent mille"
    parts.push(thousands === 1 ? 'mille' : `${below1000(thousands, false)} mille`);
  }
  if (rest > 0) parts.push(below1000(rest, true));

  return parts.join(' ');
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * amountToWordsFr(6000)    → "Six mille DA"
 * amountToWordsFr(6000.5)  → "Six mille DA et cinquante centimes"
 */
export function amountToWordsFr(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) throw new RangeError('Amount must be a positive number');
  const totalCents = Math.round(amount * 100);
  const integer = Math.floor(totalCents / 100);
  const cents = totalCents % 100;

  let out = `${capitalize(integerToWordsFr(integer))} DA`;
  if (cents > 0) {
    out += ` et ${integerToWordsFr(cents)} ${cents === 1 ? 'centime' : 'centimes'}`;
  }
  return out;
}
