import type { ClinicSettings } from '../types/settings';
import { idb, metaStore } from './db';
import { DEFAULT_SETTINGS } from './defaults';

export interface SettingsRepository {
  load(): Promise<ClinicSettings>;
  save(settings: ClinicSettings): Promise<void>;
  getSaveFolder(): Promise<FileSystemDirectoryHandle | undefined>;
  setSaveFolder(handle: FileSystemDirectoryHandle | undefined): Promise<void>;
}

const SETTINGS_KEY = 'settings';
const FOLDER_KEY = 'saveFolderHandle';

/** Merges stored settings with defaults so new fields added later always exist. */
export function mergeSettings(stored: Partial<ClinicSettings> | undefined): ClinicSettings {
  let clinicTaglineFr = stored?.clinicTaglineFr;
  if (
    !clinicTaglineFr ||
    clinicTaglineFr.trim() === 'Dental Implantology and' ||
    !clinicTaglineFr.includes('Aesthetic Dentistry')
  ) {
    clinicTaglineFr = DEFAULT_SETTINGS.clinicTaglineFr;
  }

  let clinicTaglineAr = stored?.clinicTaglineAr;
  if (
    !clinicTaglineAr ||
    clinicTaglineAr.trim() === 'طب، زراعة وتجميل الأسنان' ||
    !clinicTaglineAr.includes('حي الرمال - الوادي')
  ) {
    clinicTaglineAr = DEFAULT_SETTINGS.clinicTaglineAr;
  }

  let clinicNameFr = stored?.clinicNameFr;
  if (
    !clinicNameFr ||
    clinicNameFr === 'El Amir Dental Clinic' ||
    clinicNameFr === 'Cabinet Dentaire El Amir'
  ) {
    clinicNameFr = DEFAULT_SETTINGS.clinicNameFr;
  }

  let clinicNameAr = stored?.clinicNameAr;
  if (!clinicNameAr || clinicNameAr === 'عيادة الأمير لطب الأسنان') {
    clinicNameAr = DEFAULT_SETTINGS.clinicNameAr;
  }

  let address = stored?.address;
  if (!address || address.includes('Boulevard du 1er Novembre') || address.includes('alamane') || !address.includes('Errimel')) {
    address = DEFAULT_SETTINGS.address;
  }

  let addressAr = stored?.addressAr;
  if (!addressAr || addressAr.includes('أول نوفمبر') || addressAr.includes('الأمان') || !addressAr.includes('الرمال')) {
    addressAr = DEFAULT_SETTINGS.addressAr;
  }

  let phones = stored?.phones;
  if (!phones || phones.includes('032 11') || !phones.includes('0777')) {
    phones = DEFAULT_SETTINGS.phones;
  }

  let website = stored?.website ?? '';
  if (website.includes('alamane')) {
    website = '';
  }

  let email = stored?.email ?? '';
  if (email.includes('alamane')) {
    email = '';
  }

  let footerStyle = stored?.footerStyle;
  if (!footerStyle || footerStyle === 'grey') {
    footerStyle = 'blue';
  }

  return {
    ...DEFAULT_SETTINGS,
    ...(stored ?? {}),
    clinicNameFr,
    clinicTaglineFr,
    clinicNameAr,
    clinicTaglineAr,
    address,
    addressAr,
    phones,
    website,
    email,
    footerStyle,
    showBackgroundPattern: stored?.showBackgroundPattern ?? DEFAULT_SETTINGS.showBackgroundPattern,
    backgroundPatternColor: stored?.backgroundPatternColor ?? DEFAULT_SETTINGS.backgroundPatternColor,
    showWatermark: stored?.showWatermark ?? DEFAULT_SETTINGS.showWatermark,
    vatMention: { ...DEFAULT_SETTINGS.vatMention, ...(stored?.vatMention ?? {}) },
    footerText: { ...DEFAULT_SETTINGS.footerText, ...(stored?.footerText ?? {}) },
    acts: stored?.acts ?? DEFAULT_SETTINGS.acts,
  };
}

export const localSettingsRepository: SettingsRepository = {
  async load() {
    const raw = await idb.get<Partial<ClinicSettings>>(SETTINGS_KEY, metaStore);
    const merged = mergeSettings(raw);
    if (
      raw &&
      (raw.clinicTaglineFr !== merged.clinicTaglineFr ||
        raw.clinicTaglineAr !== merged.clinicTaglineAr ||
        raw.clinicNameFr !== merged.clinicNameFr ||
        raw.clinicNameAr !== merged.clinicNameAr ||
        raw.address !== merged.address ||
        raw.addressAr !== merged.addressAr ||
        raw.phones !== merged.phones ||
        raw.website !== merged.website ||
        raw.email !== merged.email ||
        raw.footerStyle !== merged.footerStyle)
    ) {
      await idb.set(SETTINGS_KEY, merged, metaStore);
    }
    return merged;
  },
  async save(settings) {
    await idb.set(SETTINGS_KEY, settings, metaStore);
  },
  async getSaveFolder() {
    return idb.get<FileSystemDirectoryHandle>(FOLDER_KEY, metaStore);
  },
  async setSaveFolder(handle) {
    if (handle) await idb.set(FOLDER_KEY, handle, metaStore);
    else await idb.del(FOLDER_KEY, metaStore);
  },
};

export const settingsRepository: SettingsRepository = localSettingsRepository;
