import type { ClinicSettings } from '../types/settings';
import type { SettingsRepository } from './settingsRepository';
import { mergeSettings } from './settingsRepository';
import { getNeonSql } from './neonClient';
import { idb, metaStore } from './db';

const SETTINGS_KEY = 'settings';
const FOLDER_KEY = 'saveFolderHandle';

export const neonSettingsRepository: SettingsRepository = {
  async load(): Promise<ClinicSettings> {
    const sql = getNeonSql();
    let raw: Partial<ClinicSettings> | undefined;

    if (sql) {
      try {
        const rows = await sql`
          SELECT data FROM clinic_settings WHERE id = 'settings' LIMIT 1;
        `;
        if (rows.length > 0) {
          raw = (typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data) as Partial<ClinicSettings>;
        }
      } catch (err) {
        console.warn('Failed to load settings from Neon Postgres, using local cache:', err);
      }
    }

    if (!raw) {
      raw = (await idb.get<Partial<ClinicSettings>>(SETTINGS_KEY, metaStore)) ?? undefined;
    }

    const merged = mergeSettings(raw);
    await idb.set(SETTINGS_KEY, merged, metaStore);

    if (sql && raw && Object.keys(raw).length > 0) {
      try {
        await sql`
          INSERT INTO clinic_settings (id, data, updated_at)
          VALUES ('settings', ${JSON.stringify(merged)}, NOW())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
        `;
      } catch (e) {
        console.warn('Failed to cache merged settings to Neon:', e);
      }
    }

    return merged;
  },

  async save(settings: ClinicSettings): Promise<void> {
    await idb.set(SETTINGS_KEY, settings, metaStore);
    const sql = getNeonSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO clinic_settings (id, data, updated_at)
          VALUES ('settings', ${JSON.stringify(settings)}, NOW())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
        `;
      } catch (err) {
        console.error('Failed to save settings to Neon Postgres:', err);
      }
    }
  },

  async getSaveFolder(): Promise<FileSystemDirectoryHandle | undefined> {
    // Browser file handles are stored in browser-local IndexedDB
    return idb.get<FileSystemDirectoryHandle>(FOLDER_KEY, metaStore);
  },

  async setSaveFolder(handle: FileSystemDirectoryHandle | undefined): Promise<void> {
    if (handle) await idb.set(FOLDER_KEY, handle, metaStore);
    else await idb.del(FOLDER_KEY, metaStore);
  },
};
