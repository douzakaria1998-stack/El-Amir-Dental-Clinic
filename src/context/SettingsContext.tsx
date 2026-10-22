import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ClinicSettings } from '../types/settings';
import { settingsRepository } from '../storage/settingsRepository';
import { DEFAULT_SETTINGS } from '../storage/defaults';

interface SettingsContextType {
  settings: ClinicSettings;
  updateSettings: (newSettings: ClinicSettings) => Promise<void>;
  qrDataUrl: string;
  loading: boolean;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_SETTINGS);
  const [qrDataUrl, setQrDataUrl] = useState<string>('/footer-qr.png');
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const loaded = await settingsRepository.load();
      setSettings(loaded);
      setQrDataUrl('/footer-qr.png');
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateSettings = async (newSettings: ClinicSettings) => {
    await settingsRepository.save(newSettings);
    setSettings(newSettings);
    setQrDataUrl('/footer-qr.png');
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        qrDataUrl,
        loading,
        reload: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
