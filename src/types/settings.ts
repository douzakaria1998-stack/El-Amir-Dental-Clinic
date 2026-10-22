import type { Lang } from './invoice';

export interface Bilingual {
  fr: string;
  en: string;
}

export interface PredefinedAct {
  id: string;
  fr: string;
  en: string;
  /** Optional default fee suggested when the act is picked. */
  defaultFee?: number | null;
}

export type SaveMethod = 'dialog' | 'folder' | 'download';
export type ThousandsSeparator = 'none' | 'space' | 'dot';
export type LogoPosition = 'center' | 'left';
export type FooterStyle = 'grey' | 'blue';
export type BackgroundPatternColor = 'blue' | 'grey';

export interface ClinicSettings {
  clinicNameFr: string;
  clinicTaglineFr: string;
  clinicNameAr: string;
  clinicTaglineAr: string;
  /** Data URL of an uploaded logo; null → built-in El Amir logo. */
  logoDataUrl: string | null;
  logoPosition: LogoPosition;

  rc: string;
  nis: string;
  nif: string;

  address: string;
  addressAr: string;
  phones: string;
  email: string;
  website: string;

  vatEnabled: boolean;
  vatMention: Bilingual;
  footerText: Bilingual;

  /** Footer bar style: grey (reference image 1) or blue (letterhead brand) */
  footerStyle: FooterStyle;
  /** Whether to render the light diagonal brand pattern across the invoice page */
  showBackgroundPattern: boolean;
  /** Color tone of the light background pattern */
  backgroundPatternColor: BackgroundPatternColor;
  /** Subtle watermark emblem in the center of the invoice */
  showWatermark: boolean;

  acts: PredefinedAct[];

  thousandsSeparator: ThousandsSeparator;

  saveMethod: SaveMethod;
  /** Display name of the remembered folder (the handle itself is in IndexedDB). */
  saveFolderName: string;

  defaultInvoiceLang: Lang;
  defaultAppLang: Lang;
}
