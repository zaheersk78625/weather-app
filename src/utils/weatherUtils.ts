import { UserSettings } from '../types';

// Convert Celsius to Fahrenheit
export function formatTemp(tempC: number, unit: 'celsius' | 'fahrenheit'): string {
  if (unit === 'fahrenheit') {
    const f = (tempC * 9) / 5 + 32;
    return `${Math.round(f)}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

export function formatTempRaw(tempC: number, unit: 'celsius' | 'fahrenheit'): number {
  if (unit === 'fahrenheit') {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
}

// Convert wind speed
export function formatWindSpeed(speedKmh: number, unit: UserSettings['windSpeedUnit']): string {
  switch (unit) {
    case 'mph':
      return `${Math.round(speedKmh * 0.621371)} mph`;
    case 'ms':
      return `${(speedKmh / 3.6).toFixed(1)} m/s`;
    case 'knots':
      return `${Math.round(speedKmh * 0.539957)} kn`;
    case 'kmh':
    default:
      return `${Math.round(speedKmh)} km/h`;
  }
}

// Format Time (e.g., "12:05 PM" or "2:00 PM")
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return isoString;
  }
}

// Format Hour only (e.g. "12 PM", "1 PM", "Now")
export function formatHour(isoString: string, isFirst: boolean = false): string {
  if (isFirst) return 'Now';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  } catch {
    return isoString;
  }
}

// Format Day (e.g. "Today", "Mon", "Tue", "Wednesday, Aug 31")
export function formatDayName(dateString: string, index: number = -1): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short' });
  } catch {
    return dateString;
  }
}

export function formatFullDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// UV Index category and color
export function getUvCategory(uv: number): { label: string; color: string; bg: string; description: string } {
  if (uv <= 2) {
    return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500', description: 'No protection needed. Safe for outdoor activities.' };
  }
  if (uv <= 5) {
    return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500', description: 'Wear sunglasses and apply SPF 30+ sunscreen.' };
  }
  if (uv <= 7) {
    return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500', description: 'Protection required. Seek shade during midday.' };
  }
  if (uv <= 10) {
    return { label: 'Very High', color: 'text-rose-500', bg: 'bg-rose-500', description: 'Extra protection needed. Avoid direct sun from 10 AM to 4 PM.' };
  }
  return { label: 'Extreme', color: 'text-purple-400', bg: 'bg-purple-500', description: 'Take all precautions. Unprotected skin can burn quickly.' };
}

// Air Pressure Level
export function getPressureStatus(hPa: number): string {
  if (hPa > 1020) return 'High Pressure (Clear, Stable)';
  if (hPa < 1000) return 'Low Pressure (Stormy / Rain)';
  return 'Normal Pressure (Stable)';
}

// Visibility Level
export function getVisibilityStatus(km: number): string {
  if (km >= 10) return 'Crystal Clear';
  if (km >= 6) return 'Good Visibility';
  if (km >= 3) return 'Moderate Haze';
  return 'Poor / Heavy Fog';
}

// Background Theme Styling based on weather condition & daytime
export function getWeatherTheme(bgType: string, isDay: boolean): {
  gradient: string;
  cardBg: string;
  accentColor: string;
  textColor: string;
} {
  if (!isDay) {
    return {
      gradient: 'from-slate-950 via-indigo-950/70 to-slate-950',
      cardBg: 'bg-slate-900/60 border-slate-800/60 shadow-slate-950/40',
      accentColor: 'text-indigo-400',
      textColor: 'text-slate-100',
    };
  }

  switch (bgType) {
    case 'sunny':
      return {
        gradient: 'from-sky-500/20 via-amber-500/10 to-slate-950',
        cardBg: 'bg-slate-900/60 border-amber-500/20 shadow-amber-950/20',
        accentColor: 'text-amber-400',
        textColor: 'text-slate-100',
      };
    case 'rain':
      return {
        gradient: 'from-blue-950/60 via-slate-900/80 to-slate-950',
        cardBg: 'bg-slate-900/60 border-blue-500/20 shadow-blue-950/30',
        accentColor: 'text-blue-400',
        textColor: 'text-slate-100',
      };
    case 'thunderstorm':
      return {
        gradient: 'from-purple-950/70 via-slate-950 to-slate-950',
        cardBg: 'bg-slate-900/70 border-purple-500/30 shadow-purple-950/40',
        accentColor: 'text-purple-400',
        textColor: 'text-slate-100',
      };
    case 'snow':
      return {
        gradient: 'from-cyan-950/40 via-slate-900/70 to-slate-950',
        cardBg: 'bg-slate-900/60 border-cyan-500/20 shadow-cyan-950/20',
        accentColor: 'text-cyan-400',
        textColor: 'text-slate-100',
      };
    case 'fog':
      return {
        gradient: 'from-zinc-900/80 via-slate-900 to-slate-950',
        cardBg: 'bg-slate-900/60 border-zinc-700/40 shadow-zinc-950/30',
        accentColor: 'text-zinc-300',
        textColor: 'text-slate-100',
      };
    case 'cloudy':
    default:
      return {
        gradient: 'from-slate-900/60 via-slate-900/90 to-slate-950',
        cardBg: 'bg-slate-900/60 border-slate-800/60 shadow-slate-950/30',
        accentColor: 'text-sky-400',
        textColor: 'text-slate-100',
      };
  }
}
