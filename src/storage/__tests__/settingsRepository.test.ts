import { describe, it, expect } from 'vitest';
import { mergeSettings } from '../settingsRepository';

describe('mergeSettings', () => {
  it('supplements partial single-line taglines with the rest of the official header lines', () => {
    const partial = {
      clinicTaglineFr: 'Dental Implantology and',
      clinicTaglineAr: 'طب، زراعة وتجميل الأسنان',
    };
    const merged = mergeSettings(partial as any);

    expect(merged.clinicTaglineFr).toContain('Dental Implantology and');
    expect(merged.clinicTaglineFr).toContain('Aesthetic Dentistry');
    expect(merged.clinicTaglineFr).toContain('Errimel - El Oued');
    expect(merged.clinicTaglineFr).toContain('BAT: 08/39/1801');

    expect(merged.clinicTaglineAr).toContain('طب، زراعة وتجميل الأسنان');
    expect(merged.clinicTaglineAr).toContain('حي الرمال - الوادي');
    expect(merged.clinicTaglineAr).toContain('بالقرب من المحكمة');
  });

  it('sets official doctor names when missing or using legacy clinic name placeholders', () => {
    const merged = mergeSettings({
      clinicNameFr: 'El Amir Dental Clinic',
      clinicNameAr: 'عيادة الأمير لطب الأسنان',
    } as any);

    expect(merged.clinicNameFr).toBe('Dr. Medjouel Yahia Amir');
    expect(merged.clinicNameAr).toBe('الدكتور مجوّل يحي أمير');
  });

  it('preserves customized multi-line taglines and doctor names', () => {
    const custom = {
      clinicNameFr: 'Dr. Custom Name',
      clinicTaglineFr: 'Dental Implantology and\nAesthetic Dentistry\nCustom Line',
      clinicNameAr: 'الدكتور مخصص',
      clinicTaglineAr: 'طب، زراعة وتجميل الأسنان\nحي الرمال - الوادي\nسطر مخصص',
    };
    const merged = mergeSettings(custom as any);

    expect(merged.clinicNameFr).toBe('Dr. Custom Name');
    expect(merged.clinicTaglineFr).toBe(custom.clinicTaglineFr);
    expect(merged.clinicNameAr).toBe('الدكتور مخصص');
    expect(merged.clinicTaglineAr).toBe(custom.clinicTaglineAr);
  });

  it('migrates legacy Al-Amane address, phone and clears obsolete websites/emails', () => {
    const legacy = {
      address: '17, Boulevard du 1er Novembre 1954 - El Oued',
      addressAr: '17، شارع أول نوفمبر 1954 - الوادي',
      phones: '032 11 25 24 | 032 11 20 97',
      website: 'www.alamaneclinic.com',
      email: 'contact@alamaneclinic.com',
    };
    const merged = mergeSettings(legacy as any);

    expect(merged.address).toBe('Hai Errimel - El Oued');
    expect(merged.addressAr).toBe('حي الرمال - الوادي، بالقرب من المحكمة');
    expect(merged.phones).toBe('0777 77 53 77 | 0652 69 59 69');
    expect(merged.website).toBe('');
    expect(merged.email).toBe('');
    expect(merged.footerStyle).toBe('blue');
  });
});
