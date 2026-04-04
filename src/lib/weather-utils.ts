import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  CloudMoon,
} from "lucide-react";
import { format } from 'date-fns';

export function formatTemp(tempC: number, unit: 'C' | 'F') {
  if (unit === 'F') return Math.round((tempC * 9/5) + 32);
  return Math.round(tempC);
}

export function formatTime(date: Date, timeFormat: '12h' | '24h') {
  return format(date, timeFormat === '12h' ? 'h:mm a' : 'HH:mm');
}

export function formatHour(date: Date, timeFormat: '12h' | '24h') {
  return format(date, timeFormat === '12h' ? 'ha' : 'HH:00');
}

export function getWeatherInfo(code: number, isDay: boolean = true) {
  // WMO Weather interpretation codes (WW)
  if (code === 0) {
    return {
      label: "Clear sky",
      icon: isDay ? Sun : Moon,
      color: isDay ? "text-yellow-400" : "text-blue-200",
      bgGradient: isDay ? "from-blue-400 to-blue-200" : "from-indigo-900 to-slate-800",
      darkBgGradient: isDay ? "from-blue-900 to-slate-800" : "from-indigo-950 to-black",
    };
  }
  if (code === 1 || code === 2 || code === 3) {
    return {
      label: code === 3 ? "Overcast" : "Partly cloudy",
      icon: isDay ? CloudSun : CloudMoon,
      color: isDay ? "text-yellow-200" : "text-blue-100",
      bgGradient: isDay ? "from-blue-300 to-gray-200" : "from-slate-800 to-gray-700",
      darkBgGradient: isDay ? "from-slate-800 to-slate-700" : "from-slate-900 to-black",
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: "Fog",
      icon: CloudFog,
      color: "text-gray-400",
      bgGradient: "from-gray-400 to-gray-300",
      darkBgGradient: "from-gray-800 to-gray-900",
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      label: "Drizzle",
      icon: CloudDrizzle,
      color: "text-blue-300",
      bgGradient: "from-gray-500 to-blue-300",
      darkBgGradient: "from-slate-800 to-blue-950",
    };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      label: "Rain",
      icon: CloudRain,
      color: "text-blue-500",
      bgGradient: "from-gray-700 to-blue-600",
      darkBgGradient: "from-slate-900 to-blue-950",
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      label: "Snow",
      icon: CloudSnow,
      color: "text-white",
      bgGradient: "from-blue-100 to-gray-200",
      darkBgGradient: "from-slate-800 to-slate-900",
    };
  }
  if (code >= 95 && code <= 99) {
    return {
      label: "Thunderstorm",
      icon: CloudLightning,
      color: "text-yellow-500",
      bgGradient: "from-gray-900 to-purple-900",
      darkBgGradient: "from-black to-purple-950",
    };
  }
  
  return {
    label: "Unknown",
    icon: Cloud,
    color: "text-gray-400",
    bgGradient: "from-gray-300 to-gray-100",
    darkBgGradient: "from-gray-800 to-gray-900",
  };
}
