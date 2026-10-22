import { describe, expect, it } from 'vitest';
import { amountToWordsFr } from '../amountToWordsFr';
import { amountToWordsEn } from '../amountToWordsEn';
import { amountToWords } from '../amountToWords';

describe('amountToWordsFr — required cases', () => {
  const cases: [number, string][] = [
    [6000, 'Six mille DA'],
    [1500, 'Mille cinq cents DA'],
    [3500, 'Trois mille cinq cents DA'],
    [12000, 'Douze mille DA'],
    [18000, 'Dix-huit mille DA'],
    [21000, 'Vingt et un mille DA'],
    [71, 'Soixante et onze DA'],
    [80, 'Quatre-vingts DA'],
    [81, 'Quatre-vingt-un DA'],
    [91, 'Quatre-vingt-onze DA'],
    [200, 'Deux cents DA'],
    [201, 'Deux cent un DA'],
    [80000, 'Quatre-vingt mille DA'],
    [100000, 'Cent mille DA'],
    [250000, 'Deux cent cinquante mille DA'],
    [1000000, 'Un million DA'],
    [2000000, 'Deux millions DA'],
  ];
  it.each(cases)('%i → %s', (n, expected) => {
    expect(amountToWordsFr(n)).toBe(expected);
  });
});

describe('amountToWordsFr — additional rules', () => {
  const cases: [number, string][] = [
    [0, 'Zéro DA'],
    [1, 'Un DA'],
    [16, 'Seize DA'],
    [17, 'Dix-sept DA'],
    [21, 'Vingt et un DA'],
    [22, 'Vingt-deux DA'],
    [31, 'Trente et un DA'],
    [41, 'Quarante et un DA'],
    [51, 'Cinquante et un DA'],
    [61, 'Soixante et un DA'],
    [70, 'Soixante-dix DA'],
    [77, 'Soixante-dix-sept DA'],
    [83, 'Quatre-vingt-trois DA'],
    [90, 'Quatre-vingt-dix DA'],
    [99, 'Quatre-vingt-dix-neuf DA'],
    [100, 'Cent DA'],
    [101, 'Cent un DA'],
    [180, 'Cent quatre-vingts DA'],
    [1000, 'Mille DA'],
    [2000, 'Deux mille DA'],
    [12500, 'Douze mille cinq cents DA'],
    [200000, 'Deux cent mille DA'],
    [280000, 'Deux cent quatre-vingt mille DA'],
    [200000000, 'Deux cents millions DA'],
    [80000000, 'Quatre-vingts millions DA'],
    [1001001, 'Un million mille un DA'],
    [1000000000, 'Un milliard DA'],
  ];
  it.each(cases)('%i → %s', (n, expected) => {
    expect(amountToWordsFr(n)).toBe(expected);
  });

  it('appends centimes', () => {
    expect(amountToWordsFr(6000.5)).toBe('Six mille DA et cinquante centimes');
    expect(amountToWordsFr(10.01)).toBe('Dix DA et un centime');
    expect(amountToWordsFr(6000.0)).toBe('Six mille DA');
  });

  it('rejects negative amounts', () => {
    expect(() => amountToWordsFr(-1)).toThrow(RangeError);
  });
});

describe('amountToWordsEn — required cases', () => {
  const cases: [number, string][] = [
    [0, 'Zero DA'],
    [6000, 'Six thousand DA'],
    [1500, 'One thousand five hundred DA'],
    [3500, 'Three thousand five hundred DA'],
    [12000, 'Twelve thousand DA'],
    [21000, 'Twenty-one thousand DA'],
    [71, 'Seventy-one DA'],
    [80, 'Eighty DA'],
    [201, 'Two hundred one DA'],
    [12500, 'Twelve thousand five hundred DA'],
    [100000, 'One hundred thousand DA'],
    [250000, 'Two hundred fifty thousand DA'],
    [1000000, 'One million DA'],
    [2000000, 'Two million DA'],
  ];
  it.each(cases)('%i → %s', (n, expected) => {
    expect(amountToWordsEn(n)).toBe(expected);
  });
});

describe('amountToWordsEn — additional rules', () => {
  const cases: [number, string][] = [
    [15, 'Fifteen DA'],
    [99, 'Ninety-nine DA'],
    [100, 'One hundred DA'],
    [125, 'One hundred twenty-five DA'],
    [1000, 'One thousand DA'],
    [1001001, 'One million one thousand one DA'],
    [999999, 'Nine hundred ninety-nine thousand nine hundred ninety-nine DA'],
  ];
  it.each(cases)('%i → %s', (n, expected) => {
    expect(amountToWordsEn(n)).toBe(expected);
  });

  it('appends centimes', () => {
    expect(amountToWordsEn(6000.5)).toBe('Six thousand DA and fifty centimes');
    expect(amountToWordsEn(3.01)).toBe('Three DA and one centime');
  });
});

describe('amountToWords dispatcher', () => {
  it('follows the invoice language', () => {
    expect(amountToWords(6000, 'fr')).toBe('Six mille DA');
    expect(amountToWords(6000, 'en')).toBe('Six thousand DA');
  });
});
