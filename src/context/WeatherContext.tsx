import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData, LocationInfo, FavoriteCity, UserSettings } from '../types';
import { weatherApi } from '../services/api';
import { useAuth } from './AuthContext';

interface WeatherContextType {
  location: LocationInfo | null;
  weather: WeatherData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isDetectingLocation: boolean;
  locationMessage: string | null;
  error: string | null;
  permissionDenied: boolean;
  favorites: FavoriteCity[];
  settings: UserSettings;
  activeTab: 'home' | 'forecast' | 'map' | 'favorites' | 'settings';
  setActiveTab: (tab: 'home' | 'forecast' | 'map' | 'favorites' | 'settings') => void;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  addFavorite: (city: LocationInfo) => Promise<void>;
  removeFavorite: (id: number) => Promise<void>;
  isCurrentFavorite: boolean;
  toggleFavoriteCurrent: () => Promise<void>;
  setLocationAndFetch: (loc: LocationInfo) => Promise<void>;
  autoDetectLocation: (showToasts?: boolean) => Promise<void>;
  requestGpsLocation: () => Promise<void>;
  refreshWeather: () => Promise<void>;
  clearError: () => void;
}

const defaultSettings: UserSettings = {
  temperatureUnit: 'celsius',
  windSpeedUnit: 'kmh',
  theme: 'dark',
  autoLocation: true,
  notifications: true,
  refreshInterval: 30,
};

const defaultLocation: LocationInfo = {
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  displayName: 'Hyderabad, Telangana, India',
  latitude: 17.3850,
  longitude: 78.4867,
  isGps: false,
  isIp: false,
  source: 'default',
};

// Fast local storage helpers for instant zero-latency startup
const getCachedLocation = (): LocationInfo => {
  try {
    const raw = localStorage.getItem('weathersphere_last_location');
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultLocation;
};

const getCachedWeather = (): WeatherData | null => {
  try {
    const raw = localStorage.getItem('weathersphere_cached_weather');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'forecast' | 'map' | 'favorites' | 'settings'>('home');
  
  const initialLoc = getCachedLocation();
  const initialWeather = getCachedWeather();

  const [location, setLocation] = useState<LocationInfo>(initialLoc);
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather);
  const [isLoading, setIsLoading] = useState<boolean>(!initialWeather);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<FavoriteCity[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showLocationToast = (msg: string, duration = 3500) => {
    setLocationMessage(msg);
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = setTimeout(() => {
      setLocationMessage(null);
    }, duration);
  };

  // Load Settings & Favorites in background
  useEffect(() => {
    async function loadData() {
      try {
        const [savedSettings, savedFavorites] = await Promise.all([
          weatherApi.getSettings(),
          weatherApi.getFavorites(),
        ]);
        setSettings(savedSettings || defaultSettings);
        setFavorites(savedFavorites || []);
      } catch (e) {
        console.warn('Failed to load initial settings/favorites:', e);
      }
    }
    loadData();
  }, [user]);

  // Fetch weather data for given coordinates
  const fetchWeather = useCallback(async (lat: number, lon: number, showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await weatherApi.getWeatherByCoords(lat, lon);
      setWeather(data);
      try {
        localStorage.setItem('weathersphere_cached_weather', JSON.stringify(data));
      } catch {}
    } catch (err: any) {
      console.error('Fetch weather error:', err);
      if (!weather) {
        setError(err.message || 'Unable to fetch weather. Check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [weather]);

  // Multi-tier Auto Detect Location (Tier 1: Fast Browser GPS, Tier 2: Fast Network IP, Tier 3: Default)
  const autoDetectLocation = useCallback(async (showToasts = true) => {
    setIsDetectingLocation(true);
    setError(null);
    setPermissionDenied(false);

    if (showToasts) {
      showLocationToast('Auto-detecting your location...', 4000);
    }

    const tryIpFallback = async (reason = '') => {
      try {
        const ipLoc = await weatherApi.detectIpLocation();
        setLocation(ipLoc);
        try {
          localStorage.setItem('weathersphere_last_location', JSON.stringify(ipLoc));
        } catch {}
        if (showToasts) {
          showLocationToast(`📍 Detected: ${ipLoc.city}${ipLoc.country ? ', ' + ipLoc.country : ''} (Network IP)`, 3500);
        }
        await fetchWeather(ipLoc.latitude, ipLoc.longitude);
      } catch (ipErr) {
        console.warn('IP location detection fallback failed:', ipErr);
        if (!location) {
          setLocation(defaultLocation);
          await fetchWeather(defaultLocation.latitude, defaultLocation.longitude);
        }
        if (showToasts && reason) {
          setError(reason);
        }
      } finally {
        setIsDetectingLocation(false);
      }
    };

    if (!navigator.geolocation) {
      setPermissionDenied(true);
      await tryIpFallback('Geolocation is not supported by your browser.');
      return;
    }

    let resolved = false;

    // Safety timeout for fast response (2.5 seconds) before automatically resolving via IP
    const gpsTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('GPS timed out, seamlessly resolving via fast IP geolocation...');
        tryIpFallback();
      }
    }, 2500);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(gpsTimeout);

        const { latitude, longitude } = position.coords;
        try {
          const geoInfo = await weatherApi.reverseGeocode(latitude, longitude);
          const newLoc: LocationInfo = {
            city: geoInfo.city,
            state: geoInfo.state,
            country: geoInfo.country,
            displayName: geoInfo.displayName,
            latitude,
            longitude,
            isGps: true,
            isIp: false,
            source: 'gps',
          };
          setLocation(newLoc);
          try {
            localStorage.setItem('weathersphere_last_location', JSON.stringify(newLoc));
          } catch {}
          if (showToasts) {
            showLocationToast(`📍 Detected: ${newLoc.city}${newLoc.country ? ', ' + newLoc.country : ''} (GPS)`, 3500);
          }
          await fetchWeather(latitude, longitude);
        } catch (e) {
          const fallbackLoc: LocationInfo = {
            city: 'My Location',
            displayName: `GPS: ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            latitude,
            longitude,
            isGps: true,
            isIp: false,
            source: 'gps',
          };
          setLocation(fallbackLoc);
          try {
            localStorage.setItem('weathersphere_last_location', JSON.stringify(fallbackLoc));
          } catch {}
          await fetchWeather(latitude, longitude);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      async (geoErr) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(gpsTimeout);

        console.warn('Geolocation permission/signal issue:', geoErr);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setPermissionDenied(true);
        }
        // Seamlessly auto-detect through IP Geolocation
        await tryIpFallback();
      },
      { timeout: 2500, enableHighAccuracy: false, maximumAge: 600000 }
    );
  }, [fetchWeather, location]);

  // Request GPS Location alias
  const requestGpsLocation = useCallback(async () => {
    await autoDetectLocation(true);
  }, [autoDetectLocation]);

  // Initial Boot - Fast instant fetch + background auto-detection
  useEffect(() => {
    const loc = getCachedLocation();
    fetchWeather(loc.latitude, loc.longitude);
    // Background auto-detection without blocking UI
    autoDetectLocation(false);
  }, []);

  // Periodic Auto-refresh Timer
  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (!settings.refreshInterval || settings.refreshInterval <= 0) return;

    const ms = settings.refreshInterval * 60 * 1000;
    refreshTimerRef.current = setInterval(() => {
      if (location) {
        fetchWeather(location.latitude, location.longitude, true);
      }
    }, ms);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [location, settings.refreshInterval, fetchWeather]);

  // Set location and fetch
  const setLocationAndFetch = useCallback(async (loc: LocationInfo) => {
    setLocation(loc);
    await fetchWeather(loc.latitude, loc.longitude);
  }, [fetchWeather]);

  // Manual refresh
  const refreshWeather = useCallback(async () => {
    if (location) {
      await fetchWeather(location.latitude, location.longitude, true);
    } else {
      await requestGpsLocation();
    }
  }, [location, fetchWeather, requestGpsLocation]);

  // Update user settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('weathersphere_settings', JSON.stringify(updated));
    await weatherApi.updateSettings(updated);
  };

  // Favorites management
  const addFavorite = async (cityLoc: LocationInfo) => {
    const newFav = await weatherApi.addFavorite({
      city: cityLoc.city,
      country: cityLoc.country,
      state: cityLoc.state,
      latitude: cityLoc.latitude,
      longitude: cityLoc.longitude,
    });
    setFavorites((prev) => {
      const filtered = prev.filter((f) => Math.abs(f.latitude - newFav.latitude) > 0.02 || Math.abs(f.longitude - newFav.longitude) > 0.02);
      const updated = [newFav, ...filtered];
      localStorage.setItem('weathersphere_local_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFavorite = async (id: number) => {
    await weatherApi.removeFavorite(id);
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem('weathersphere_local_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const isCurrentFavorite = Boolean(
    location &&
      favorites.some(
        (f) =>
          Math.abs(f.latitude - location.latitude) < 0.02 &&
          Math.abs(f.longitude - location.longitude) < 0.02
      )
  );

  const toggleFavoriteCurrent = async () => {
    if (!location) return;
    if (isCurrentFavorite) {
      const matched = favorites.find(
        (f) =>
          Math.abs(f.latitude - location.latitude) < 0.02 &&
          Math.abs(f.longitude - location.longitude) < 0.02
      );
      if (matched) {
        await removeFavorite(matched.id);
      }
    } else {
      await addFavorite(location);
    }
  };

  const clearError = () => setError(null);

  return (
    <WeatherContext.Provider
      value={{
        location,
        weather,
        isLoading,
        isRefreshing,
        isDetectingLocation,
        locationMessage,
        error,
        permissionDenied,
        favorites,
        settings,
        activeTab,
        setActiveTab,
        updateSettings,
        addFavorite,
        removeFavorite,
        isCurrentFavorite,
        toggleFavoriteCurrent,
        setLocationAndFetch,
        autoDetectLocation,
        requestGpsLocation,
        refreshWeather,
        clearError,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
