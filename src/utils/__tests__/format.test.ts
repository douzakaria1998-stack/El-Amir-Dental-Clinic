import { describe, expect, it } from 'vitest';
import { formatDateDMY, formatNumber, formatAmount, sumFees } from '../format';

describe('formatDateDMY', () => {
  it('formats ISO date strings as DD/MM/YYYY', () => {
    expect(formatDateDMY('2026-06-20')).toBe('20/06/2026');
    expect(formatDateDMY('1949-03-20')).toBe('20/03/1949');
    expect(formatDateDMY('')).toBe('');
    expect(formatDateDMY(null)).toBe('');
  });
});

describe('formatNumber and formatAmount', () => {
  it('formats without thousands separator', () => {
    expect(formatNumber(6000, 'none')).toBe('6000');
    expect(formatAmount(6000, 'none')).toBe('6000\u00A0DA');
  });

  it('formats with space thousands separator', () => {
    expect(formatNumber(12500, 'space')).toBe('12\u00A0500');
    expect(formatAmount(12500, 'space')).toBe('12\u00A0500\u00A0DA');
  });

  it('formats with dot thousands separator', () => {
    expect(formatNumber(12500, 'dot')).toBe('12.500');
    expect(formatAmount(12500, 'dot')).toBe('12.500\u00A0DA');
  });

  it('formats decimals when present', () => {
    expect(formatNumber(6000.5, 'none')).toBe('6000,50');
  });
});

describe('sumFees', () => {
  it('sums numerical fees ignoring empty or null values', () => {
    expect(sumFees([1000, 2500, null, undefined, 500])).toBe(4000);
    expect(sumFees([])).toBe(0);
  });
});
