import { WeatherData, SearchCityResult, FavoriteCity, UserSettings, UserProfile, LocationInfo } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('weathersphere_jwt_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const weatherApi = {
  // Fetch real-time weather by latitude and longitude
  async getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
    const res = await fetch(`${API_BASE}/weather/forecast?lat=${lat}&lon=${lon}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load weather' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  // Fetch real-time weather by city name
  async getWeatherByCity(city: string): Promise<WeatherData> {
    const res = await fetch(`${API_BASE}/weather/forecast?city=${encodeURIComponent(city)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load weather for city' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  // Autocomplete city search
  async searchCities(query: string): Promise<SearchCityResult[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      const res = await fetch(`${API_BASE}/weather/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('City search failed:', e);
      return [];
    }
  },

  // Reverse geocode lat/lon into city details with fast multi-source fallback
  async reverseGeocode(lat: number, lon: number): Promise<{
    city: string;
    state?: string;
    country?: string;
    displayName: string;
  }> {
    // 1. Try server endpoint first with 2s timeout
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/weather/location?lat=${lat}&lon=${lon}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.city && data.city !== 'Current Location') {
          return data;
        }
      }
    } catch (e) {
      // Continue to direct client fallback
    }

    // 2. Direct browser BigDataCloud reverse geocode (super fast <100ms)
    try {
      const bdcController = new AbortController();
      const bdcTimeout = setTimeout(() => bdcController.abort(), 1500);
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        { signal: bdcController.signal }
      );
      clearTimeout(bdcTimeout);
      if (bdcRes.ok) {
        const data = await bdcRes.json();
        const city = data.city || data.locality || data.principalSubdivision || 'Current Location';
        const state = data.principalSubdivision || '';
        const country = data.countryName || '';
        return {
          city,
          state,
          country,
          displayName: `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`,
        };
      }
    } catch (bdcErr) {
      // fallback
    }

    return {
      city: 'Current Location',
      displayName: `GPS: ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    };
  },

  // Auto-detect location via IP Geolocation (Fast multi-source parallel race)
  async detectIpLocation(): Promise<LocationInfo> {
    const fetchDirectIpwho = async (): Promise<LocationInfo | null> => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2000);
        const res = await fetch('https://ipwho.is/', { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          const data = await res.json();
          if (data.success !== false && data.latitude && data.longitude) {
            const city = data.city || data.region || 'Current Location';
            const state = data.region || '';
            const country = data.country || '';
            return {
              city,
              state,
              country,
              displayName: `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`,
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              isGps: false,
              isIp: true,
              source: 'ip'
            };
          }
        }
      } catch {}
      return null;
    };

    const fetchServerIp = async (): Promise<LocationInfo | null> => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2000);
        const res = await fetch(`${API_BASE}/weather/ip-location`, { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          return await res.json();
        }
      } catch {}
      return null;
    };

    try {
      // Race direct browser IP and server IP for maximum speed (<250ms)
      const results = await Promise.allSettled([fetchDirectIpwho(), fetchServerIp()]);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value && result.value.city) {
          return result.value;
        }
      }
    } catch (e) {
      console.warn('IP auto-detection error:', e);
    }

    return {
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      displayName: 'Hyderabad, Telangana, India',
      latitude: 17.3850,
      longitude: 78.4867,
      isGps: false,
      isIp: false,
      source: 'default'
    };
  },

  // Favorites API
  async getFavorites(): Promise<FavoriteCity[]> {
    try {
      const res = await fetch(`${API_BASE}/favorites`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Error fetching favorites:', e);
    }
    // Fallback to local storage
    const stored = localStorage.getItem('weathersphere_local_favorites');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return [
      { id: 1, city: 'Hyderabad', country: 'India', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
      { id: 2, city: 'Khammam', country: 'India', state: 'Telangana', latitude: 17.2473, longitude: 80.1514 },
      { id: 3, city: 'Vijayawada', country: 'India', state: 'Andhra Pradesh', latitude: 16.5062, longitude: 80.6480 },
      { id: 4, city: 'Mumbai', country: 'India', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
      { id: 5, city: 'Bengaluru', country: 'India', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 }
    ];
  },

  async addFavorite(item: { city: string; country?: string; state?: string; latitude: number; longitude: number }): Promise<FavoriteCity> {
    try {
      const res = await fetch(`${API_BASE}/favorites`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend save favorite error:', e);
    }

    const localFav: FavoriteCity = {
      id: Date.now(),
      ...item,
      createdAt: new Date().toISOString(),
    };
    return localFav;
  },

  async removeFavorite(id: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/favorites/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) return true;
    } catch (e) {
      console.warn('Backend remove favorite error:', e);
    }
    return true;
  },

  // Settings API
  async getSettings(): Promise<UserSettings> {
    try {
      const res = await fetch(`${API_BASE}/user/settings`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend get settings error:', e);
    }
    const local = localStorage.getItem('weathersphere_settings');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return {
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      theme: 'dark',
      autoLocation: true,
      notifications: true,
      refreshInterval: 30,
    };
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const res = await fetch(`${API_BASE}/user/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        return data.settings;
      }
    } catch (e) {
      console.warn('Backend update settings error:', e);
    }
    return settings as UserSettings;
  },

  // Auth API
  async register(name: string, email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserProfile; settings?: UserSettings; favorites?: FavoriteCity[] }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid credentials');
    }
    return res.json();
  },

  async getProfile(): Promise<{ user: UserProfile; settings?: UserSettings; favorites?: FavoriteCity[] }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error('Unauthorized');
    }
    return res.json();
  },
};
