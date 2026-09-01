import React from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  Droplets,
  Wind,
  SunMedium,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Cloud,
  Compass
} from 'lucide-react';
import {
  formatWindSpeed,
  formatTime,
  getUvCategory,
  getPressureStatus,
  getVisibilityStatus
} from '../utils/weatherUtils';

export const WeatherDetailsGrid: React.FC = () => {
  const { weather, settings } = useWeather();

  if (!weather) return null;

  const current = weather.current;
  const windFormatted = formatWindSpeed(current.windSpeed, settings.windSpeedUnit);
  const gustFormatted = formatWindSpeed(current.windGusts, settings.windSpeedUnit);
  const uvCategory = getUvCategory(current.uvIndex);
  const pressureStatus = getPressureStatus(current.pressure);
  const visibilityStatus = getVisibilityStatus(current.visibility);

  const sunriseTime = current.sunrise ? formatTime(current.sunrise) : '6:05 AM';
  const sunsetTime = current.sunset ? formatTime(current.sunset) : '6:38 PM';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Humidity Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-cyan-400" />
            Humidity
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {current.humidityDescription}
          </span>
        </div>

        <div className="my-4">
          <div className="text-4xl font-extrabold text-slate-100 font-heading">
            {current.humidity}%
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-950/80 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${current.humidity}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400">
          The dew point is currently comfortable for normal outdoor activities.
        </p>
      </div>

      {/* 2. Wind Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wind className="w-4 h-4 text-teal-400" />
            Wind & Direction
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
            {current.windDirection} ({current.windDegree}°)
          </span>
        </div>

        <div className="my-3 flex items-center justify-between">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-100 font-heading">
              {windFormatted}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Gusts up to <span className="font-semibold text-slate-200">{gustFormatted}</span>
            </p>
          </div>

          {/* Rotating Compass Indicator */}
          <div className="relative w-16 h-16 rounded-full bg-slate-950 border border-slate-700/60 flex items-center justify-center shadow-inner">
            <span className="absolute top-1 text-[9px] font-bold text-slate-400">N</span>
            <span className="absolute bottom-1 text-[9px] font-bold text-slate-500">S</span>
            <span className="absolute left-1.5 text-[9px] font-bold text-slate-500">W</span>
            <span className="absolute right-1.5 text-[9px] font-bold text-slate-500">E</span>
            <div
              className="w-8 h-8 flex items-center justify-center transition-transform duration-700"
              style={{ transform: `rotate(${current.windDegree}deg)` }}
            >
              <div className="w-1.5 h-6 bg-gradient-to-t from-teal-400 to-rose-500 rounded-full" />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Steady breeze from the {current.windDirection}.
        </p>
      </div>

      {/* 3. UV Index Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <SunMedium className="w-4 h-4 text-amber-400" />
            UV Index
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${uvCategory.color} bg-slate-950 border border-slate-800`}>
            {uvCategory.label}
          </span>
        </div>

        <div className="my-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-100 font-heading">
              {current.uvIndex}
            </span>
            <span className="text-sm font-semibold text-slate-400">/ 11+</span>
          </div>

          {/* UV gradient scale */}
          <div className="w-full h-2 bg-gradient-to-r from-emerald-500 via-amber-500 via-rose-500 to-purple-600 rounded-full mt-3 relative">
            <div
              className="absolute -top-1 w-4 h-4 bg-white rounded-full border-2 border-slate-900 shadow-md -translate-x-1/2 transition-all duration-500"
              style={{ left: `${Math.min(100, (current.uvIndex / 11) * 100)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400">
          {uvCategory.description}
        </p>
      </div>

      {/* 4. Visibility Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-sky-400" />
            Visibility
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {visibilityStatus}
          </span>
        </div>

        <div className="my-4">
          <div className="text-4xl font-extrabold text-slate-100 font-heading">
            {current.visibility} <span className="text-lg font-normal text-slate-400">km</span>
          </div>
          <div className="w-full h-2 bg-slate-950/80 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-sky-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (current.visibility / 10) * 100)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Clear visual conditions with minimal atmospheric haze.
        </p>
      </div>

      {/* 5. Pressure Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-purple-400" />
            Atmospheric Pressure
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {current.pressure >= 1013 ? 'Normal' : 'Low'}
          </span>
        </div>

        <div className="my-4">
          <div className="text-4xl font-extrabold text-slate-100 font-heading">
            {current.pressure} <span className="text-lg font-normal text-slate-400">hPa</span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          {pressureStatus}
        </p>
      </div>

      {/* 6. Sunrise & Sunset Golden Arc Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sunrise className="w-4 h-4 text-amber-400" />
            Sunrise & Sunset
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Cloud Cover: {current.cloudPercentage}%
          </span>
        </div>

        {/* Visual indicators */}
        <div className="my-4 grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Sunrise className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Sunrise</p>
              <p className="text-sm font-bold text-slate-100">{sunriseTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400">
              <Sunset className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Sunset</p>
              <p className="text-sm font-bold text-slate-100">{sunsetTime}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Approximately 12 hours of natural daylight today.
        </p>
      </div>
    </div>
  );
};
