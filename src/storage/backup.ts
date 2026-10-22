import type { Invoice } from '../types/invoice';
import type { ClinicSettings } from '../types/settings';
import { invoiceRepository } from './invoiceRepository';
import { mergeSettings, settingsRepository } from './settingsRepository';

export interface BackupFile {
  app: 'elamir-invoice-generator';
  version: 1;
  exportedAt: string;
  settings: ClinicSettings;
  invoices: Invoice[];
  counters: Record<string, number>;
}

export async function exportBackup(): Promise<BackupFile> {
  return {
    app: 'elamir-invoice-generator',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await settingsRepository.load(),
    invoices: await invoiceRepository.list(),
    counters: await invoiceRepository.counters(),
  };
}

export function downloadJson(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Validates and restores a backup. Throws on invalid files. */
export async function importBackup(text: string): Promise<{ settings: ClinicSettings; count: number }> {
  const data = JSON.parse(text) as Partial<BackupFile>;
  if (data.app !== 'elamir-invoice-generator' || !Array.isArray(data.invoices)) {
    throw new Error('invalid-backup');
  }
  const settings = mergeSettings(data.settings);
  await settingsRepository.save(settings);
  await invoiceRepository.replaceAll(data.invoices, data.counters ?? {});
  return { settings, count: data.invoices.length };
}
