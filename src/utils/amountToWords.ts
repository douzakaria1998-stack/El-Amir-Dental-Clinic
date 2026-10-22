import { amountToWordsFr } from './amountToWordsFr';
import { amountToWordsEn } from './amountToWordsEn';
import type { Lang } from '../types/invoice';

export { amountToWordsFr, amountToWordsEn };

const converters: Record<Lang, (amount: number) => string> = {
  fr: amountToWordsFr,
  en: amountToWordsEn,
};

/** Picks the converter that matches the invoice language. */
export function amountToWords(amount: number, lang: Lang): string {
  return converters[lang](amount);
}
