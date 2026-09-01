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

// WMO Weather interpretation code mapper
function interpretWmoCode(code: number): { condition: string; description: string; icon: string; bgType: string } {
  switch (code) {
    case 0:
      return { condition: 'Clear Sky', description: 'Completely sunny and clear', icon: 'clear-day', bgType: 'sunny' };
    case 1:
      return { condition: 'Mainly Clear', description: 'Mostly sunny with scattered bright skies', icon: 'mostly-clear-day', bgType: 'sunny' };
    case 2:
      return { condition: 'Partly Cloudy', description: 'Passing clouds with sunny intervals', icon: 'partly-cloudy-day', bgType: 'cloudy' };
    case 3:
      return { condition: 'Overcast', description: 'Dense overcast cloud cover', icon: 'cloudy', bgType: 'cloudy' };
    case 45:
      return { condition: 'Foggy', description: 'Low-lying surface fog and reduced visibility', icon: 'fog', bgType: 'fog' };
    case 48:
      return { condition: 'Depositing Rime Fog', description: 'Icy freezing fog', icon: 'fog', bgType: 'fog' };
    case 51:
      return { condition: 'Light Drizzle', description: 'Light fine drizzling rain', icon: 'drizzle', bgType: 'rain' };
    case 53:
      return { condition: 'Moderate Drizzle', description: 'Steady damp drizzle', icon: 'drizzle', bgType: 'rain' };
    case 55:
      return { condition: 'Dense Drizzle', description: 'Heavy continuous drizzle', icon: 'drizzle', bgType: 'rain' };
    case 61:
      return { condition: 'Slight Rain', description: 'Scattered light rain showers', icon: 'rain-light', bgType: 'rain' };
    case 63:
      return { condition: 'Moderate Rain', description: 'Steady moderate rainfall', icon: 'rain', bgType: 'rain' };
    case 65:
      return { condition: 'Heavy Rain', description: 'Heavy torrential downpours', icon: 'rain-heavy', bgType: 'rain' };
    case 71:
      return { condition: 'Slight Snow', description: 'Light fluttering snowfall', icon: 'snow', bgType: 'snow' };
    case 73:
      return { condition: 'Moderate Snow', description: 'Steady snowfall accumulation', icon: 'snow', bgType: 'snow' };
    case 75:
      return { condition: 'Heavy Snow', description: 'Dense blizzard-like snowfall', icon: 'snow-heavy', bgType: 'snow' };
    case 80:
      return { condition: 'Light Rain Showers', description: 'Brief passing rain showers', icon: 'rain-light', bgType: 'rain' };
    case 81:
      return { condition: 'Moderate Rain Showers', description: 'Scattered gusty showers', icon: 'rain', bgType: 'rain' };
    case 82:
      return { condition: 'Violent Rain Showers', description: 'Intense sudden torrential showers', icon: 'rain-heavy', bgType: 'rain' };
    case 95:
      return { condition: 'Thunderstorm', description: 'Active thunderstorm with lightning and gusty winds', icon: 'thunderstorm', bgType: 'thunderstorm' };
    case 96:
    case 99:
      return { condition: 'Severe Thunderstorm', description: 'Violent thunderstorm with hail risk', icon: 'thunderstorm', bgType: 'thunderstorm' };
    default:
      return { condition: 'Fair', description: 'Mild and pleasant conditions', icon: 'partly-cloudy-day', bgType: 'cloudy' };
  }
}

function degToCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

// Client-side Open-Meteo parser fallback (runs everywhere even if deployed without server)
async function fetchDirectOpenMeteo(lat: number, lon: number): Promise<WeatherData> {
  const url = (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant` +
    `&timezone=auto&forecast_days=14`
  );

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo API status ${res.status}`);
  }

  const rawData = await res.json();
  const current = rawData.current || {};
  const hourly = rawData.hourly || {};
  const daily = rawData.daily || {};

  const currentWeatherInterp = interpretWmoCode(current.weather_code ?? 0);
  const windDirectionCompass = degToCompass(current.wind_direction_10m ?? 0);

  // Hourly
  const hourlyForecast: any[] = [];
  const startIndex = 0;
  const endIndex = Math.min((hourly.time || []).length, 36);

  for (let i = startIndex; i < endIndex; i++) {
    const code = hourly.weather_code ? hourly.weather_code[i] : 0;
    const interp = interpretWmoCode(code);
    hourlyForecast.push({
      time: hourly.time[i],
      temp: Math.round(hourly.temperature_2m[i]),
      apparentTemp: Math.round(hourly.apparent_temperature[i]),
      humidity: hourly.relative_humidity_2m[i],
      pop: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
      precipitation: hourly.precipitation ? hourly.precipitation[i] : 0,
      weatherCode: code,
      condition: interp.condition,
      icon: interp.icon,
      windSpeed: Math.round(hourly.wind_speed_10m[i]),
      windDirection: degToCompass(hourly.wind_direction_10m[i]),
      uvIndex: hourly.uv_index ? hourly.uv_index[i] : 0,
      visibility: hourly.visibility ? (hourly.visibility[i] / 1000).toFixed(1) : '10.0',
      pressure: hourly.surface_pressure ? Math.round(hourly.surface_pressure[i]) : 1013,
      isDay: hourly.is_day ? hourly.is_day[i] === 1 : true
    });
  }

  // Daily
  const dailyForecast: any[] = [];
  const dailyCount = (daily.time || []).length;
  for (let i = 0; i < dailyCount; i++) {
    const code = daily.weather_code ? daily.weather_code[i] : 0;
    const interp = interpretWmoCode(code);
    dailyForecast.push({
      date: daily.time[i],
      weatherCode: code,
      condition: interp.condition,
      icon: interp.icon,
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      apparentTempMax: Math.round(daily.apparent_temperature_max[i]),
      apparentTempMin: Math.round(daily.apparent_temperature_min[i]),
      pop: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
      precipitationSum: daily.precipitation_sum ? daily.precipitation_sum[i] : 0,
      uvIndexMax: daily.uv_index_max ? daily.uv_index_max[i] : 0,
      windSpeedMax: Math.round(daily.wind_speed_10m_max[i]),
      windDirectionDominant: degToCompass(daily.wind_direction_10m_dominant[i]),
      sunrise: daily.sunrise ? daily.sunrise[i] : '',
      sunset: daily.sunset ? daily.sunset[i] : ''
    });
  }

  const currentUv = hourlyForecast.length > 0 ? (hourlyForecast[0].uvIndex || 0) : (daily.uv_index_max ? daily.uv_index_max[0] : 0);
  const currentVisibility = hourlyForecast.length > 0 ? parseFloat(hourlyForecast[0].visibility) : 10.0;

  let uvDescription = 'Low';
  if (currentUv >= 11) uvDescription = 'Extreme';
  else if (currentUv >= 8) uvDescription = 'Very High';
  else if (currentUv >= 6) uvDescription = 'High';
  else if (currentUv >= 3) uvDescription = 'Moderate';

  const humidityVal = current.relative_humidity_2m ?? 50;
  let humidityDescription = 'Comfortable';
  if (humidityVal > 75) humidityDescription = 'Humid & Muggy';
  else if (humidityVal > 60) humidityDescription = 'Slightly Humid';
  else if (humidityVal < 30) humidityDescription = 'Dry & Crisp';

  const alerts: any[] = [];
  if (current.temperature_2m >= 40) {
    alerts.push({
      id: 'alert-heat-extreme',
      severity: 'extreme',
      event: 'Extreme Heat Warning',
      headline: 'Dangerous High Temperatures Expected',
      description: `Peak temperatures are reaching ${Math.round(current.temperature_2m)}°C. Stay hydrated.`,
      urgency: 'Immediate',
      areas: 'Local District'
    });
  } else if (current.temperature_2m >= 35) {
    alerts.push({
      id: 'alert-heat-advisory',
      severity: 'moderate',
      event: 'Heat Advisory',
      headline: 'Unusually High Daytime Temperatures',
      description: `Temperature is currently ${Math.round(current.temperature_2m)}°C. Drink plenty of water.`,
      urgency: 'Expected',
      areas: 'Local District'
    });
  }

  if (current.weather_code === 95 || current.weather_code === 96 || current.weather_code === 99) {
    alerts.push({
      id: 'alert-thunderstorm',
      severity: 'severe',
      event: 'Severe Thunderstorm Warning',
      headline: 'Active Thunderstorm with Lightning in Area',
      description: 'Dangerous lightning and heavy rain showers detected. Seek shelter.',
      urgency: 'Immediate',
      areas: 'Metro Region'
    });
  }

  return {
    latitude: lat,
    longitude: lon,
    elevation: rawData.elevation || 0,
    timezone: rawData.timezone || 'auto',
    lastUpdated: new Date().toISOString(),
    current: {
      temp: Math.round(current.temperature_2m ?? 0),
      feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0),
      condition: currentWeatherInterp.condition,
      description: currentWeatherInterp.description,
      icon: currentWeatherInterp.icon,
      bgType: currentWeatherInterp.bgType,
      isDay: current.is_day === 1,
      humidity: humidityVal,
      humidityDescription,
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      windDirection: windDirectionCompass,
      windDegree: current.wind_direction_10m ?? 0,
      windGusts: Math.round(current.wind_gusts_10m ?? current.wind_speed_10m ?? 0),
      pressure: Math.round(current.surface_pressure ?? current.pressure_msl ?? 1013),
      cloudPercentage: Math.round(current.cloud_cover ?? 0),
      uvIndex: currentUv,
      uvDescription,
      visibility: currentVisibility,
      tempHigh: dailyForecast.length > 0 ? dailyForecast[0].tempMax : Math.round(current.temperature_2m + 3),
      tempLow: dailyForecast.length > 0 ? dailyForecast[0].tempMin : Math.round(current.temperature_2m - 4),
      sunrise: daily.sunrise ? daily.sunrise[0] : '',
      sunset: daily.sunset ? daily.sunset[0] : ''
    },
    hourly: hourlyForecast,
    daily: dailyForecast,
    alerts,
  };
}

export const weatherApi = {
  // Fetch real-time weather by latitude and longitude with universal fallback
  async getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE}/weather/forecast?lat=${lat}&lon=${lon}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Continue to direct Open-Meteo browser call
    }

    return await fetchDirectOpenMeteo(lat, lon);
  },

  // Fetch real-time weather by city name
  async getWeatherByCity(city: string): Promise<WeatherData> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${API_BASE}/weather/forecast?city=${encodeURIComponent(city)}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Continue to client geocoding
    }

    // Direct geocoding fallback
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`City "${city}" not found`);
    }
    return await fetchDirectOpenMeteo(geoData.results[0].latitude, geoData.results[0].longitude);
  },

  // Autocomplete city search with dual-tier fallback
  async searchCities(query: string): Promise<SearchCityResult[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/weather/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // fallback to direct Open-Meteo geocoding
    }

    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json`
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.results) return [];
      return data.results.map((r: any) => ({
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        country: r.country || '',
        admin1: r.admin1 || '',
        displayName: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`
      }));
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

  // Auto-detect location via IP Geolocation (Fast multi-source parallel race across 4 major providers)
  async detectIpLocation(): Promise<LocationInfo> {
    const fetchIpwhois = async (): Promise<LocationInfo | null> => {
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

    const fetchIpapi = async (): Promise<LocationInfo | null> => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2000);
        const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const city = data.city || data.region || 'Current Location';
            const state = data.region || '';
            const country = data.country_name || '';
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
          const data = await res.json();
          if (data.latitude && data.longitude) {
            return data;
          }
        }
      } catch {}
      return null;
    };

    try {
      // Race direct browser IP endpoints and server IP for maximum speed and accuracy
      const results = await Promise.allSettled([fetchIpwhois(), fetchIpapi(), fetchServerIp()]);
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value && result.value.city && result.value.latitude) {
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

  // Auth APIs
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    } catch (e: any) {
      // Offline / client mock authentication fallback
      const token = 'jwt_token_' + Date.now();
      const user: UserProfile = {
        id: 1,
        name: email.split('@')[0] || 'User',
        email,
        createdAt: new Date().toISOString(),
      };
      return { token, user };
    }
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    } catch (e: any) {
      const token = 'jwt_token_' + Date.now();
      const user: UserProfile = {
        id: Date.now(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      return { token, user };
    }
  },

  async getProfile(): Promise<{ user: UserProfile }> {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend get profile error:', e);
    }
    const token = localStorage.getItem('weathersphere_jwt_token');
    if (token) {
      return {
        user: {
          id: 1,
          name: 'Demo User',
          email: 'demo@weathersphere.com',
          createdAt: new Date().toISOString(),
        }
      };
    }
    throw new Error('Not authenticated');
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
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend update settings error:', e);
    }
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('weathersphere_settings', JSON.stringify(updated));
    return updated;
  },

  // User Profile
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/user/profile`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend get profile error:', e);
    }
    const userStr = localStorage.getItem('weathersphere_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {}
    }
    return null;
  },
};
