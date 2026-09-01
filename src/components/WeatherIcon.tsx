import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Snowflake,
  Wind
} from 'lucide-react';

interface WeatherIconProps {
  name: string;
  isDay?: boolean;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  name,
  isDay = true,
  className = 'w-6 h-6',
  size = 24
}) => {
  const iconLower = name.toLowerCase();

  if (iconLower.includes('sun') || iconLower === 'clear' || iconLower === 'clear sky') {
    return isDay ? (
      <Sun className={`${className} text-amber-400 animate-spin-slow`} size={size} />
    ) : (
      <Moon className={`${className} text-indigo-300`} size={size} />
    );
  }

  if (iconLower.includes('thunder') || iconLower.includes('lightning')) {
    return <CloudLightning className={`${className} text-amber-300 animate-pulse`} size={size} />;
  }

  if (iconLower.includes('snow') || iconLower.includes('ice')) {
    return <Snowflake className={`${className} text-cyan-200`} size={size} />;
  }

  if (iconLower.includes('drizzle')) {
    return <CloudDrizzle className={`${className} text-sky-400`} size={size} />;
  }

  if (iconLower.includes('rain') || iconLower.includes('shower')) {
    return <CloudRain className={`${className} text-blue-400`} size={size} />;
  }

  if (iconLower.includes('fog') || iconLower.includes('mist') || iconLower.includes('haze')) {
    return <CloudFog className={`${className} text-slate-300`} size={size} />;
  }

  if (iconLower.includes('wind') || iconLower.includes('storm')) {
    return <Wind className={`${className} text-teal-300`} size={size} />;
  }

  if (iconLower.includes('cloud') || iconLower.includes('overcast')) {
    if (isDay) {
      return <CloudSun className={`${className} text-sky-300`} size={size} />;
    }
    return <CloudMoon className={`${className} text-indigo-200`} size={size} />;
  }

  return isDay ? (
    <Sun className={`${className} text-amber-400`} size={size} />
  ) : (
    <Moon className={`${className} text-indigo-300`} size={size} />
  );
};
