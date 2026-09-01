export interface LocationInfo {
  city: string;
  state?: string;
  country?: string;
  displayName: string;
  latitude: number;
  longitude: number;
  isGps?: boolean;
  isIp?: boolean;
  source?: 'gps' | 'ip' | 'search' | 'favorite' | 'default';
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  bgType: string;
  isDay: boolean;
  humidity: number;
  humidityDescription: string;
  windSpeed: number;
  windDirection: string;
  windDegree: number;
  windGusts: number;
  pressure: number;
  cloudPercentage: number;
  uvIndex: number;
  uvDescription: string;
  visibility: number; // in km
  tempHigh: number;
  tempLow: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyForecastItem {
  time: string;
  temp: number;
  apparentTemp: number;
  humidity: number;
  pop: number; // probability of precipitation (0-100)
  precipitation: number;
  weatherCode: number;
  condition: string;
  icon: string;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
  visibility: string;
  pressure: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  condition: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  pop: number;
  precipitationSum: number;
  uvIndexMax: number;
  windSpeedMax: number;
  windDirectionDominant: string;
  sunrise: string;
  sunset: string;
}

export interface WeatherAlert {
  id: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  event: string;
  headline: string;
  description: string;
  urgency: string;
  areas: string;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  lastUpdated: string;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  alerts: WeatherAlert[];
}

export interface SearchCityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  countryCode?: string;
  admin1?: string; // state
  timezone?: string;
  elevation?: number;
}

export interface FavoriteCity {
  id: number;
  userId?: number;
  city: string;
  country?: string;
  state?: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

export interface UserSettings {
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'mph' | 'ms' | 'knots';
  theme: 'dark' | 'light' | 'system';
  autoLocation: boolean;
  notifications: boolean;
  refreshInterval: number; // in minutes
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

export type TabType = 'home' | 'forecast' | 'map' | 'favorites' | 'settings';
