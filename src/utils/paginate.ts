/**
 * Splits table rows across A4 pages when the invoice cannot fit on a single
 * page even at the densest layout. Pure function → unit-tested.
 *
 * @param rowHeights height of each act row (px)
 * @param bodyHeight usable height of the page body (between header and footer)
 * @param introHeight legal block + title + patient block (page 1 only)
 * @param theadHeight table header row (repeated on every page)
 * @param tailHeight total cell + VAT + amount in words (last page only)
 * @returns number of rows on each page (always at least one page)
 */
export function paginateRows(
  rowHeights: number[],
  bodyHeight: number,
  introHeight: number,
  theadHeight: number,
  tailHeight: number,
): number[] {
  const pages: number[] = [];
  let i = 0;
  let first = true;

  while (i < rowHeights.length) {
    let used = (first ? introHeight : 0) + theadHeight;
    let count = 0;
    while (i + count < rowHeights.length && used + rowHeights[i + count] <= bodyHeight) {
      used += rowHeights[i + count];
      count++;
    }
    if (count === 0) count = 1; // a single row taller than a page: force progress
    pages.push(count);
    i += count;
    first = false;
  }

  if (pages.length === 0) pages.push(0);

  // Make sure the tail (total + mentions) fits on the last page.
  const lastStart = pages.slice(0, -1).reduce((a, b) => a + b, 0);
  const lastRows = rowHeights.slice(lastStart);
  const lastIntro = pages.length === 1 ? introHeight : 0;
  const lastUsed = lastIntro + theadHeight + lastRows.reduce((a, b) => a + b, 0);
  if (lastUsed + tailHeight > bodyHeight) {
    // Move rows from the last page to a new page until the tail fits on that new page.
    const moved: number[] = [];
    let remaining = lastUsed;
    const last = pages.length - 1;
    while (pages[last] > 1 && remaining + tailHeight > bodyHeight) {
      const h = rowHeights[lastStart + pages[last] - 1];
      pages[last]--;
      remaining -= h;
      moved.unshift(h);
    }
    if (remaining + tailHeight > bodyHeight) {
      // Tail still doesn't fit → tail alone on an extra page (with no rows).
      pages.push(moved.length);
    } else if (moved.length > 0) {
      pages.push(moved.length);
    }
  }
  return pages;
}
