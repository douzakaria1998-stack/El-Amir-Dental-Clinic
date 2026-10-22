import { describe, expect, it } from 'vitest';
import { paginateRows } from '../paginate';

describe('paginateRows', () => {
  it('returns a single page when all rows fit', () => {
    const rowHeights = [30, 30, 30];
    const bodyHeight = 500;
    const introHeight = 100;
    const theadHeight = 40;
    const tailHeight = 80;

    const pages = paginateRows(rowHeights, bodyHeight, introHeight, theadHeight, tailHeight);
    expect(pages).toEqual([3]);
  });

  it('splits rows across multiple pages when height exceeds single page', () => {
    // 20 rows of 30px = 600px
    const rowHeights = Array(20).fill(30);
    const bodyHeight = 300;
    const introHeight = 100;
    const theadHeight = 40;
    const tailHeight = 50;

    const pages = paginateRows(rowHeights, bodyHeight, introHeight, theadHeight, tailHeight);
    expect(pages.length).toBeGreaterThan(1);
    const totalDistributed = pages.reduce((a, b) => a + b, 0);
    expect(totalDistributed).toBe(20);
  });
});
