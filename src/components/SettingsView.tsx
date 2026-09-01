import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Thermometer,
  Wind,
  Moon,
  Sun,
  Navigation,
  Bell,
  RefreshCw,
  Globe,
  Smartphone,
  User,
  LogOut,
  LogIn,
  CheckCircle2,
  Database,
  Info,
  ShieldCheck
} from 'lucide-react';

interface SettingsViewProps {
  onOpenAuth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuth }) => {
  const { settings, updateSettings, refreshWeather, autoDetectLocation, isDetectingLocation, location } = useWeather();
  const { user, isAuthenticated, logout } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Catch PWA beforeinstallprompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install WeatherSphere on Android/iOS, tap "Add to Home Screen" in your browser menu!');
    }
  };

  const handleSettingChange = async (newVal: any) => {
    await updateSettings(newVal);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-heading flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            App Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Customize units, notifications, themes, and account sync
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>

      {/* Account Section */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-lg">
              {isAuthenticated ? user?.name?.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {isAuthenticated ? user?.name : 'Guest User'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAuthenticated ? user?.email : 'Sign in to sync favorites & settings to cloud'}
              </p>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 text-rose-400 hover:bg-rose-500/10 border border-slate-700 active:scale-95 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
          <Database className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Database Storage: <strong className="text-slate-200">MySQL / REST Cloud Active</strong> (JWT Authenticated)
          </span>
        </div>
      </div>

      {/* Weather Units */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Units & Measurements
        </h3>

        {/* Temperature Unit */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Temperature Unit</p>
              <p className="text-xs text-slate-400">Choose between Celsius and Fahrenheit</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSettingChange({ temperatureUnit: 'celsius' })}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                settings.temperatureUnit === 'celsius'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Celsius (°C)
            </button>
            <button
              onClick={() => handleSettingChange({ temperatureUnit: 'fahrenheit' })}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                settings.temperatureUnit === 'fahrenheit'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fahrenheit (°F)
            </button>
          </div>
        </div>

        {/* Wind Speed Unit */}
        <div className="flex items-center justify-between py-1 border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-2.5">
            <Wind className="w-4 h-4 text-teal-400" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Wind Speed Unit</p>
              <p className="text-xs text-slate-400">Display wind velocity</p>
            </div>
          </div>

          <select
            value={settings.windSpeedUnit}
            onChange={(e) => handleSettingChange({ windSpeedUnit: e.target.value })}
            className="px-3 py-1.5 text-xs font-bold bg-slate-950 text-slate-200 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500"
          >
            <option value="kmh">km/h (Kilometers/hr)</option>
            <option value="mph">mph (Miles/hr)</option>
            <option value="ms">m/s (Meters/sec)</option>
            <option value="knots">knots (Nautical)</option>
          </select>
        </div>
      </div>

      {/* Preferences & Behavior */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Preferences & Updates
        </h3>

        {/* Dark / Light Theme */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Theme Appearance</p>
              <p className="text-xs text-slate-400">Dark mode / Light mode / System</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSettingChange({ theme: 'dark' })}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                settings.theme === 'dark'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dark 🌙
            </button>
            <button
              onClick={() => handleSettingChange({ theme: 'light' })}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                settings.theme === 'light'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Light 🌞
            </button>
          </div>
        </div>

        {/* Auto Location */}
        <div className="py-1 border-t border-slate-800/60 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Automatic Location Detection</p>
                <p className="text-xs text-slate-400">Detect GPS & Network IP on application launch</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoLocation}
                onChange={(e) => handleSettingChange({ autoLocation: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Live Location Status Box & Quick Trigger */}
          <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-200 truncate">
                  {location?.city || 'Locating...'}, {location?.country || ''}
                </span>
                {location?.isGps ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    GPS
                  </span>
                ) : location?.isIp ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Network IP
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {location?.latitude?.toFixed(4)}°, {location?.longitude?.toFixed(4)}°
              </p>
            </div>

            <button
              onClick={() => autoDetectLocation(true)}
              disabled={isDetectingLocation}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
              {isDetectingLocation ? 'Detecting...' : 'Detect Now'}
            </button>
          </div>
        </div>

        {/* Weather Alerts Notifications */}
        <div className="flex items-center justify-between py-1 border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Severe Weather Alerts</p>
              <p className="text-xs text-slate-400">Push notifications for extreme storms and heat</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange({ notifications: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        {/* Refresh Interval */}
        <div className="flex items-center justify-between py-1 border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-sky-400" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Auto-Refresh Interval</p>
              <p className="text-xs text-slate-400">Background radar update frequency</p>
            </div>
          </div>

          <select
            value={settings.refreshInterval}
            onChange={(e) => handleSettingChange({ refreshInterval: Number(e.target.value) })}
            className="px-3 py-1.5 text-xs font-bold bg-slate-950 text-slate-200 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500"
          >
            <option value={15}>Every 15 mins</option>
            <option value={30}>Every 30 mins</option>
            <option value={60}>Every 1 hour</option>
            <option value={0}>Manual refresh only</option>
          </select>
        </div>
      </div>

      {/* PWA Mobile App Installation */}
      <div className="rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-slate-950/90 border border-cyan-500/30 p-5 backdrop-blur-xl shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              {isInstalled ? 'Installed as PWA Mobile App' : 'Install WeatherSphere Mobile App'}
            </h3>
            <p className="text-xs text-slate-400">
              {isInstalled
                ? 'App is running in native standalone mode with offline support'
                : 'Add to home screen on Android / iOS for instant full-screen access'}
            </p>
          </div>
        </div>

        {!isInstalled && (
          <button
            onClick={handleInstallPwa}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 shrink-0"
          >
            Install App
          </button>
        )}
      </div>

      {/* About Section */}
      <div className="rounded-3xl bg-slate-900/50 border border-slate-800/80 p-5 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>About WeatherSphere v1.0.0</span>
        </div>
        <p>
          WeatherSphere is a production-grade real-time weather mobile application featuring live GPS tracking, WMO meteorological forecasting, interactive Leaflet Doppler radar, MySQL persistence, and JWT authentication.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px]">React + Vite</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px]">Flask / Express REST API</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px]">Open-Meteo & OpenWeather</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px]">Leaflet OpenStreetMap</span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px]">Recharts</span>
        </div>
      </div>
    </div>
  );
};
