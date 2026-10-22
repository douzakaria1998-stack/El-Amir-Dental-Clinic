/**
 * Brand colours of El Amir Dental Clinic (reference: Image 2, the letterhead).
 *
 * NOTE: the reference image file was not available on disk, so these values
 * were read visually from the attachment. Replace them here with values sampled
 * from the original artwork if needed — the whole Material 3 theme is derived
 * from these seeds.
 */
export const brand = {
  /** Logo emblem, headings, contact pills. Exact primary extracted from official vector logo (#1F9ED9). */
  blue: '#1F9ED9',
  /** Top of the side-band gradient. */
  deep: '#0E4FA3',
  /** Exact light accent from official vector logo (#93C5EA). */
  sky: '#93C5EA',
  /** Thin wave lines on the side band. */
  line: '#93C5EA',
  /** Pale logo watermark behind the page content. */
  mist: '#EBF6FC',
  /** Dark navy body text ("Full Name:", "Age:"). */
  ink: '#1B2B48',
} as const;

/** Brand gradient used for the band / app-bar accents (top → bottom like the letterhead). */
export const brandGradient = `linear-gradient(160deg, ${brand.deep} 0%, ${brand.blue} 45%, ${brand.sky} 100%)`;

/** Brand typeface: rounded geometric face with Latin + Arabic glyphs, close to the letterhead lettering. */
export const brandFontFamily = '"Baloo Bhaijaan 2", "Roboto", system-ui, sans-serif';
export const uiFontFamily = '"Roboto", "Helvetica Neue", Arial, sans-serif';
