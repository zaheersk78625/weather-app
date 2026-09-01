import React from 'react';
import { useWeather } from '../context/WeatherContext';
import { WeatherIcon } from './WeatherIcon';
import { formatDayName, formatTempRaw } from '../utils/weatherUtils';
import { Calendar, CloudRain } from 'lucide-react';

export const DailyForecast: React.FC = () => {
  const { weather, settings } = useWeather();

  if (!weather || !weather.daily || weather.daily.length === 0) return null;

  const daily = weather.daily.slice(0, 7); // 7-day forecast

  // Find min and max across all 7 days for scaled visual bar
  const allMin = Math.min(...daily.map((d) => formatTempRaw(d.tempMin, settings.temperatureUnit)));
  const allMax = Math.max(...daily.map((d) => formatTempRaw(d.tempMax, settings.temperatureUnit)));
  const tempRange = Math.max(1, allMax - allMin);

  return (
    <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">7-Day Forecast</h3>
            <p className="text-xs text-slate-400">Weekly weather outlook</p>
          </div>
        </div>
      </div>

      {/* Daily List */}
      <div className="divide-y divide-slate-800/60">
        {daily.map((day, idx) => {
          const dayName = formatDayName(day.date, idx);
          const maxTemp = formatTempRaw(day.tempMax, settings.temperatureUnit);
          const minTemp = formatTempRaw(day.tempMin, settings.temperatureUnit);

          // Calculate bar left and width percentages
          const leftPercent = Math.max(0, ((minTemp - allMin) / tempRange) * 100);
          const barWidthPercent = Math.max(12, ((maxTemp - minTemp) / tempRange) * 100);

          return (
            <div
              key={day.date}
              className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
            >
              {/* Day & Date */}
              <div className="w-24 shrink-0">
                <p className={`text-sm font-bold ${idx === 0 ? 'text-cyan-400' : 'text-slate-200'}`}>
                  {dayName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </div>

              {/* Weather Icon & Rain Probability */}
              <div className="flex items-center gap-2.5 w-32 shrink-0">
                <WeatherIcon name={day.condition} isDay={true} size={24} className="w-6 h-6 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-300 truncate">{day.condition}</p>
                  {day.pop >= 10 ? (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-blue-400">
                      <CloudRain className="w-3 h-3" />
                      <span>{day.pop}%</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500">Dry</span>
                  )}
                </div>
              </div>

              {/* Temperature Bar & Min/Max values */}
              <div className="flex-1 flex items-center gap-2 max-w-xs justify-end">
                <span className="text-xs font-semibold text-slate-400 w-8 text-right font-mono">
                  {minTemp}°
                </span>

                {/* Scaled Gradient Temperature Bar */}
                <div className="flex-1 h-2 bg-slate-950/80 rounded-full overflow-hidden relative min-w-[50px] max-w-[120px]">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${barWidthPercent}%`,
                    }}
                  />
                </div>

                <span className="text-xs font-bold text-slate-100 w-8 text-left font-mono">
                  {maxTemp}°
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
