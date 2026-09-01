import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'weathersphere-jwt-secret-key-2026';
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';

app.use(express.json());

// In-memory persistent state
interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface Favorite {
  id: number;
  userId: number;
  city: string;
  country?: string;
  state?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface UserSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'mph' | 'ms' | 'knots';
  theme: 'dark' | 'light' | 'system';
  autoLocation: boolean;
  notifications: boolean;
  refreshInterval: number; // minutes
}

const users: Map<string, User> = new Map();
const favoritesByUser: Map<number, Favorite[]> = new Map();
const settingsByUser: Map<number, UserSettings> = new Map();

// Seed a default demo user
const demoPasswordHash = bcrypt.hashSync('password123', 8);
users.set('demo@example.com', {
  id: 1,
  name: 'Alex Mercer',
  email: 'demo@example.com',
  passwordHash: demoPasswordHash,
  createdAt: new Date().toISOString(),
});

settingsByUser.set(1, {
  temperatureUnit: 'celsius',
  windSpeedUnit: 'kmh',
  theme: 'dark',
  autoLocation: true,
  notifications: true,
  refreshInterval: 30,
});

favoritesByUser.set(1, [
  { id: 1, userId: 1, city: 'Hyderabad', country: 'India', state: 'Telangana', latitude: 17.3850, longitude: 78.4867, createdAt: new Date().toISOString() },
  { id: 2, userId: 1, city: 'Khammam', country: 'India', state: 'Telangana', latitude: 17.2473, longitude: 80.1514, createdAt: new Date().toISOString() },
  { id: 3, userId: 1, city: 'Vijayawada', country: 'India', state: 'Andhra Pradesh', latitude: 16.5062, longitude: 80.6480, createdAt: new Date().toISOString() },
  { id: 4, userId: 1, city: 'Mumbai', country: 'India', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, createdAt: new Date().toISOString() },
  { id: 5, userId: 1, city: 'Bengaluru', country: 'India', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946, createdAt: new Date().toISOString() },
  { id: 6, userId: 1, city: 'London', country: 'United Kingdom', state: 'England', latitude: 51.5074, longitude: -0.1278, createdAt: new Date().toISOString() }
]);

// Weather Cache (5 minutes TTL)
const weatherCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Helper to authenticate JWT
function authenticateToken(req: Request): { userId: number; email: string } | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, email: decoded.email };
  } catch (err) {
    return null;
  }
}

// Weather code to condition mapping (WMO Weather interpretation codes)
export function interpretWmoCode(code: number): { condition: string; icon: string; description: string; bgType: string } {
  switch (code) {
    case 0:
      return { condition: 'Clear Sky', icon: 'sun', description: 'Mainly clear with bright sunshine', bgType: 'sunny' };
    case 1:
      return { condition: 'Mainly Clear', icon: 'sun', description: 'Passing light clouds', bgType: 'sunny' };
    case 2:
      return { condition: 'Partly Cloudy', icon: 'cloud-sun', description: 'Scattered clouds and pleasant breeze', bgType: 'cloudy' };
    case 3:
      return { condition: 'Overcast', icon: 'cloud', description: 'Dense overcast cloud cover', bgType: 'cloudy' };
    case 45:
    case 48:
      return { condition: 'Fog', icon: 'cloud-fog', description: 'Reduced visibility due to thick fog', bgType: 'fog' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', icon: 'cloud-drizzle', description: 'Light fine drizzle droplets', bgType: 'rain' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', icon: 'cloud-rain', description: 'Steady moderate to heavy rainfall', bgType: 'rain' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { condition: 'Snow', icon: 'snowflake', description: 'Falling crisp snow flakes', bgType: 'snow' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', icon: 'cloud-rain', description: 'Sudden passing rain showers', bgType: 'rain' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', icon: 'snowflake', description: 'Intermittent snow flurries', bgType: 'snow' };
    case 95:
      return { condition: 'Thunderstorm', icon: 'cloud-lightning', description: 'Thunderstorm with frequent lightning', bgType: 'thunderstorm' };
    case 96:
    case 99:
      return { condition: 'Severe Thunderstorm', icon: 'cloud-lightning', description: 'Severe thunderstorm with possible hail', bgType: 'thunderstorm' };
    default:
      return { condition: 'Partly Cloudy', icon: 'cloud-sun', description: 'Variable cloudiness', bgType: 'cloudy' };
  }
}

// Convert wind direction degrees to compass
function degToCompass(num: number): string {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[val % 16];
}

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'WeatherSphere Express Server' });
});

// Search cities
app.get('/api/weather/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to search location' });
    }
    const data = await response.json();
    const results = (data.results || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || '',
      countryCode: item.country_code || '',
      admin1: item.admin1 || '', // State/province
      timezone: item.timezone || 'auto',
      elevation: item.elevation || 0
    }));

    res.json(results);
  } catch (error: any) {
    console.error('Search API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Reverse geocode
app.get('/api/weather/location', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon are required' });
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        { headers: { 'User-Agent': 'WeatherSphere-App/1.0 (contact: info@weathersphere.internal)' } }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.county || address.state_district || address.suburb || 'Current Location';
        const state = address.state || '';
        const country = address.country || '';
        return res.json({
          city,
          state,
          country,
          displayName: `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`,
          latitude: lat,
          longitude: lon
        });
      }
    } catch (nomErr) {
      console.warn('Nominatim reverse lookup error:', nomErr);
    }

    res.json({
      city: 'Current Location',
      state: '',
      country: '',
      displayName: `GPS: ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      latitude: lat,
      longitude: lon
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Reverse geocode failed' });
  }
});

// Auto-detect location via IP Geolocation
app.get('/api/weather/ip-location', async (req: Request, res: Response) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    // Try ipwho.is service
    try {
      const ipQuery = clientIp && !clientIp.startsWith('127.') && !clientIp.startsWith('10.') && !clientIp.startsWith('192.168.') && clientIp !== '::1'
        ? `https://ipwho.is/${clientIp}`
        : 'https://ipwho.is/';

      const ipRes = await fetch(ipQuery, { headers: { 'User-Agent': 'WeatherSphere-App/1.0' } });
      if (ipRes.ok) {
        const data = await ipRes.json();
        if (data.success !== false && data.latitude && data.longitude) {
          const city = data.city || data.region || 'Current Location';
          const state = data.region || '';
          const country = data.country || '';
          return res.json({
            city,
            state,
            country,
            displayName: `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            isGps: false,
            isIp: true,
            source: 'ip'
          });
        }
      }
    } catch (err) {
      console.warn('ipwho.is failed, trying fallback:', err);
    }

    // Secondary fallback: ipapi.co
    try {
      const ipApiRes = await fetch('https://ipapi.co/json/', { headers: { 'User-Agent': 'WeatherSphere-App/1.0' } });
      if (ipApiRes.ok) {
        const data = await ipApiRes.json();
        if (data.latitude && data.longitude) {
          const city = data.city || data.region || 'Current Location';
          const state = data.region || '';
          const country = data.country_name || '';
          return res.json({
            city,
            state,
            country,
            displayName: `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            isGps: false,
            isIp: true,
            source: 'ip'
          });
        }
      }
    } catch (err) {
      console.warn('ipapi.co failed:', err);
    }

    // Default fallback if all IP services fail
    return res.json({
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      displayName: 'Hyderabad, Telangana, India',
      latitude: 17.3850,
      longitude: 78.4867,
      isGps: false,
      isIp: false,
      source: 'default'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to detect IP location' });
  }
});

// Weather alerts generator helper
function generateWeatherAlerts(current: any, daily: any) {
  const alerts: any[] = [];

  if (current.temperature_2m >= 40) {
    alerts.push({
      id: 'alert-heat-extreme',
      severity: 'extreme',
      event: 'Extreme Heat Warning',
      headline: 'Dangerous High Temperatures Expected',
      description: `Peak temperatures are reaching ${Math.round(current.temperature_2m)}°C. Stay hydrated and avoid direct sun exposure during afternoon hours.`,
      urgency: 'Immediate',
      areas: 'Local District'
    });
  } else if (current.temperature_2m >= 35) {
    alerts.push({
      id: 'alert-heat-advisory',
      severity: 'moderate',
      event: 'Heat Advisory',
      headline: 'Unusually High Daytime Temperatures',
      description: `Temperature is currently ${Math.round(current.temperature_2m)}°C. Ensure sufficient water intake and keep pets in shade.`,
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
      description: 'Dangerous cloud-to-ground lightning and torrential downpours detected. Seek sturdy indoor shelter immediately.',
      urgency: 'Immediate',
      areas: 'Metro Region'
    });
  } else if (current.weather_code === 65 || current.weather_code === 82) {
    alerts.push({
      id: 'alert-heavy-rain',
      severity: 'moderate',
      event: 'Heavy Rainfall Alert',
      headline: 'Localized Street Flooding and Waterlogging Possible',
      description: 'Persistent heavy rain showers expected to cause reduced road traction and temporary drainage delays.',
      urgency: 'Expected',
      areas: 'Low-lying zones'
    });
  }

  if (current.wind_speed_10m >= 45 || current.wind_gusts_10m >= 55) {
    alerts.push({
      id: 'alert-strong-wind',
      severity: 'moderate',
      event: 'High Wind Warning',
      headline: `Damaging Wind Gusts up to ${Math.round(current.wind_gusts_10m || current.wind_speed_10m)} km/h`,
      description: 'Secure loose outdoor furniture and exercise caution while driving high-profile vehicles.',
      urgency: 'Expected',
      areas: 'Open Corridors'
    });
  }

  if (daily && daily.uv_index_max && daily.uv_index_max[0] >= 9) {
    alerts.push({
      id: 'alert-uv',
      severity: 'minor',
      event: 'Very High UV Radiation Alert',
      headline: `Max UV Index of ${Math.round(daily.uv_index_max[0])} forecast today`,
      description: 'Protection against sun burn required. Apply SPF 30+ sunscreen and wear UV-blocking sunglasses between 10 AM and 4 PM.',
      urgency: 'Expected',
      areas: 'Regional'
    });
  }

  return alerts;
}

// Current & Forecast Weather endpoint
app.get(['/api/weather/current', '/api/weather/forecast'], async (req: Request, res: Response) => {
  try {
    let lat = parseFloat(req.query.lat as string);
    let lon = parseFloat(req.query.lon as string);
    const city = (req.query.city as string || '').trim();

    if (isNaN(lat) || isNaN(lon)) {
      if (city) {
        // Geocode city first
        const geoResp = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        const geoData = await geoResp.json();
        if (!geoData.results || geoData.results.length === 0) {
          return res.status(404).json({ error: `City "${city}" not found` });
        }
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
      } else {
        return res.status(400).json({ error: 'Latitude and longitude or city query is required' });
      }
    }

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    // Fetch from Open-Meteo high precision API
    const url = (
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
      `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,visibility,wind_speed_10m,wind_direction_10m,uv_index,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant` +
      `&timezone=auto&forecast_days=14`
    );

    const apiResponse = await fetch(url);
    if (!apiResponse.ok) {
      throw new Error(`Weather provider responded with status ${apiResponse.status}`);
    }

    const rawData = await apiResponse.json();
    const current = rawData.current || {};
    const hourly = rawData.hourly || {};
    const daily = rawData.daily || {};

    const currentWeatherInterp = interpretWmoCode(current.weather_code ?? 0);
    const windDirectionCompass = degToCompass(current.wind_direction_10m ?? 0);

    // Format Hourly data (next 24-48 hours)
    const hourlyForecast: any[] = [];
    const currentHourIndex = hourly.time ? hourly.time.findIndex((t: string) => new Date(t).getTime() >= Date.now() - 3600000) : 0;
    const startIndex = Math.max(0, currentHourIndex);
    const endIndex = Math.min((hourly.time || []).length, startIndex + 36);

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

    // Format 7-Day / 14-Day Daily Forecast
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

    // Determine current UV Index (from hourly forecast nearest to now)
    const currentUv = hourlyForecast.length > 0 ? (hourlyForecast[0].uvIndex || 0) : (daily.uv_index_max ? daily.uv_index_max[0] : 0);
    const currentVisibility = hourlyForecast.length > 0 ? parseFloat(hourlyForecast[0].visibility) : 10.0;

    // UV Index Description
    let uvDescription = 'Low';
    if (currentUv >= 11) uvDescription = 'Extreme';
    else if (currentUv >= 8) uvDescription = 'Very High';
    else if (currentUv >= 6) uvDescription = 'High';
    else if (currentUv >= 3) uvDescription = 'Moderate';

    // Humidity Description
    const humidityVal = current.relative_humidity_2m ?? 50;
    let humidityDescription = 'Comfortable';
    if (humidityVal > 75) humidityDescription = 'Humid & Muggy';
    else if (humidityVal > 60) humidityDescription = 'Slightly Humid';
    else if (humidityVal < 30) humidityDescription = 'Dry & Crisp';

    // Dynamic Weather Alerts
    const alerts = generateWeatherAlerts(current, daily);

    const payload = {
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
      alerts
    };

    // Cache the result
    weatherCache.set(cacheKey, { timestamp: Date.now(), data: payload });

    res.json(payload);
  } catch (error: any) {
    console.error('Weather forecast API error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather data' });
  }
});

// Authentication endpoints
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (users.has(normalizedEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = users.size + 1;
    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.set(normalizedEmail, newUser);
    settingsByUser.set(userId, {
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      theme: 'dark',
      autoLocation: true,
      notifications: true,
      refreshInterval: 30,
    });
    favoritesByUser.set(userId, [
      { id: 1, userId, city: 'Hyderabad', country: 'India', state: 'Telangana', latitude: 17.3850, longitude: 78.4867, createdAt: new Date().toISOString() },
      { id: 2, userId, city: 'Mumbai', country: 'India', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, createdAt: new Date().toISOString() },
      { id: 3, userId, city: 'Bengaluru', country: 'India', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946, createdAt: new Date().toISOString() }
    ]);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      settings: settingsByUser.get(userId),
      favorites: favoritesByUser.get(userId)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email },
      settings: settingsByUser.get(user.id) || {
        temperatureUnit: 'celsius',
        windSpeedUnit: 'kmh',
        theme: 'dark',
        autoLocation: true,
        notifications: true,
        refreshInterval: 30,
      },
      favorites: favoritesByUser.get(user.id) || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

app.get('/api/auth/profile', (req: Request, res: Response) => {
  const auth = authenticateToken(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized or invalid token' });
  }
  const user = Array.from(users.values()).find(u => u.id === auth.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    settings: settingsByUser.get(user.id),
    favorites: favoritesByUser.get(user.id)
  });
});

// Favorites endpoints
app.get('/api/favorites', (req: Request, res: Response) => {
  const auth = authenticateToken(req);
  const userId = auth ? auth.userId : 1; // Default to demo user if anonymous
  const list = favoritesByUser.get(userId) || [];
  res.json(list);
});

app.post('/api/favorites', (req: Request, res: Response) => {
  const auth = authenticateToken(req);
  const userId = auth ? auth.userId : 1;
  const { city, country, state, latitude, longitude } = req.body;

  if (!city || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'City, latitude and longitude are required' });
  }

  let list = favoritesByUser.get(userId);
  if (!list) {
    list = [];
    favoritesByUser.set(userId, list);
  }

  // Check if exists
  const existing = list.find(f => Math.abs(f.latitude - Number(latitude)) < 0.02 && Math.abs(f.longitude - Number(longitude)) < 0.02);
  if (existing) {
    return res.json(existing);
  }

  const newFav: Favorite = {
    id: Date.now(),
    userId,
    city: city.trim(),
    country: country ? country.trim() : undefined,
    state: state ? state.trim() : undefined,
    latitude: Number(latitude),
    longitude: Number(longitude),
    createdAt: new Date().toISOString()
  };

  list.unshift(newFav);
  res.status(201).json(newFav);
});

app.delete('/api/favorites/:id', (req: Request, res: Response) => {
  const auth = authenticateToken(req);
  const userId = auth ? auth.userId : 1;
  const favId = Number(req.params.id);

  const list = favoritesByUser.get(userId);
  if (list) {
    favoritesByUser.set(userId, list.filter(f => f.id !== favId));
  }

  res.json({ success: true, message: 'Removed from favorites' });
});

// Settings endpoints
app.get('/api/user/settings', (req: Request, res: Response) => {
  const auth = authenticateToken(req);
  const userId = auth ? auth.userId : 1;
  const settings = settingsByUser.get(userId) || {
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    theme: 'dark',
    autoLocation: true,
    notifications: true,
    refreshInterval: 30,
  };
  res.json(settings);
});

app.put('/api/user/settings', (req: Request, res: Response) => {
  const auth = authenticateToken(req);
  const userId = auth ? auth.userId : 1;
  let currentSettings = settingsByUser.get(userId) || {
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    theme: 'dark',
    autoLocation: true,
    notifications: true,
    refreshInterval: 30,
  };

  const updated: UserSettings = {
    ...currentSettings,
    ...(req.body || {})
  };

  settingsByUser.set(userId, updated);
  res.json({ success: true, settings: updated });
});

// Vite Development & Production Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WeatherSphere Server running at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

