import React, { createContext, useContext, useState, useEffect } from 'react';

type Unit = 'C' | 'F';
type TimeFormat = '12h' | '24h';

interface Settings {
  unit: Unit;
  timeFormat: TimeFormat;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('weather_settings');
    return saved ? JSON.parse(saved) : { unit: 'C', timeFormat: '12h' };
  });

  useEffect(() => {
    localStorage.setItem('weather_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
