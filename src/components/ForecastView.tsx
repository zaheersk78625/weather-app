import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { WeatherIcon } from './WeatherIcon';
import { formatDayName, formatHour, formatTempRaw } from '../utils/weatherUtils';
import {
  Calendar,
  CloudRain,
  TrendingUp,
  Droplets,
  Wind,
  SunMedium,
  Clock,
  Sunrise,
  Sunset
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export const ForecastView: React.FC = () => {
  const { weather, location, settings } = useWeather();
  const [selectedMetric, setSelectedMetric] = useState<'temp' | 'rain' | 'wind'>('temp');

  if (!weather || !weather.daily) return null;

  const unitSymbol = settings.temperatureUnit === 'celsius' ? '°C' : '°F';
  const daily = weather.daily;
  const hourly = weather.hourly.slice(0, 36);

  // Daily Comparison Data
  const dailyChartData = daily.map((d, i) => ({
    day: formatDayName(d.date, i),
    maxTemp: formatTempRaw(d.tempMax, settings.temperatureUnit),
    minTemp: formatTempRaw(d.tempMin, settings.temperatureUnit),
    pop: d.pop,
    rainMm: d.precipitationSum,
    windMax: d.windSpeedMax,
    uvMax: d.uvIndexMax,
    condition: d.condition,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-heading">
              Extended Forecast
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              14-day precision outlook for <strong className="text-cyan-400 font-semibold">{location?.city || 'Selected Location'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Trend Chart Card */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              14-Day Multi-Metric Analysis
            </h3>
            <p className="text-xs text-slate-400">Visual trend comparison across the coming two weeks</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setSelectedMetric('temp')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedMetric === 'temp' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Temperature
            </button>
            <button
              onClick={() => setSelectedMetric('rain')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedMetric === 'rain' ? 'bg-blue-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Precipitation %
            </button>
            <button
              onClick={() => setSelectedMetric('wind')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedMetric === 'wind' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wind Speed
            </button>
          </div>
        </div>

        {/* Chart Render */}
        <div className="h-56 w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            {selectedMetric === 'temp' ? (
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="maxTempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="minTempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-2.5 shadow-xl text-xs">
                          <p className="font-bold text-slate-200">{d.day}</p>
                          <p className="text-rose-400 font-semibold">High: {d.maxTemp}{unitSymbol}</p>
                          <p className="text-sky-400 font-semibold">Low: {d.minTemp}{unitSymbol}</p>
                          <p className="text-slate-400 text-[11px]">{d.condition}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="maxTemp" stroke="#f43f5e" strokeWidth={2} fill="url(#maxTempGrad)" name="Max Temp" />
                <Area type="monotone" dataKey="minTemp" stroke="#0ea5e9" strokeWidth={2} fill="url(#minTempGrad)" name="Min Temp" />
              </AreaChart>
            ) : selectedMetric === 'rain' ? (
              <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-2.5 shadow-xl text-xs">
                          <p className="font-bold text-slate-200">{d.day}</p>
                          <p className="text-blue-400 font-semibold">Rain Probability: {d.pop}%</p>
                          <p className="text-slate-400 text-[11px]">Rainfall: {d.rainMm} mm</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pop" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Rain Probability (%)" />
              </BarChart>
            ) : (
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-2.5 shadow-xl text-xs">
                          <p className="font-bold text-slate-200">{d.day}</p>
                          <p className="text-teal-400 font-semibold">Max Wind: {d.windMax} km/h</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="windMax" stroke="#14b8a6" strokeWidth={2.5} fill="url(#windGrad)" name="Max Wind (km/h)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Daily Cards (14 Days) */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2">
          Day-by-Day Comprehensive Breakdown
        </h3>

        <div className="space-y-2.5">
          {daily.map((day, idx) => {
            const dayTitle = formatDayName(day.date, idx);
            const max = formatTempRaw(day.tempMax, settings.temperatureUnit);
            const min = formatTempRaw(day.tempMin, settings.temperatureUnit);

            return (
              <div
                key={day.date}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <WeatherIcon name={day.condition} isDay={true} size={22} className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{dayTitle}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{day.condition}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {day.pop >= 10 && (
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                      <CloudRain className="w-3 h-3" />
                      <span>{day.pop}%</span>
                    </div>
                  )}

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-100 font-mono">{max}°</span>
                    <span className="text-xs text-slate-500 ml-1.5 font-mono">/ {min}°</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
