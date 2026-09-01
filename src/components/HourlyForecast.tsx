import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { WeatherIcon } from './WeatherIcon';
import { formatHour, formatTempRaw } from '../utils/weatherUtils';
import { Clock, TrendingUp, CloudRain, LineChart as ChartIcon } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export const HourlyForecast: React.FC = () => {
  const { weather, settings } = useWeather();
  const [showChart, setShowChart] = useState(true);
  const [chartMode, setChartMode] = useState<'temp' | 'pop'>('temp');

  if (!weather || !weather.hourly || weather.hourly.length === 0) return null;

  const hourly = weather.hourly.slice(0, 24); // next 24 hours

  // Prepare chart dataset
  const chartData = hourly.map((item, index) => ({
    time: formatHour(item.time, index === 0),
    temp: formatTempRaw(item.temp, settings.temperatureUnit),
    pop: item.pop,
    condition: item.condition,
    wind: item.windSpeed,
  }));

  const unitSymbol = settings.temperatureUnit === 'celsius' ? '°C' : '°F';

  return (
    <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-5 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Hourly Forecast</h3>
            <p className="text-xs text-slate-400">Next 24 hours outlook</p>
          </div>
        </div>

        {/* Toggle between Card View and Chart mode */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setShowChart(true);
              setChartMode('temp');
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              showChart && chartMode === 'temp'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temp ({unitSymbol})
          </button>
          <button
            onClick={() => {
              setShowChart(true);
              setChartMode('pop');
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              showChart && chartMode === 'pop'
                ? 'bg-blue-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rain %
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Hourly Cards */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-1 px-1">
        {hourly.map((item, idx) => {
          const hourLabel = formatHour(item.time, idx === 0);
          const tempVal = formatTempRaw(item.temp, settings.temperatureUnit);
          const isCurrentHour = idx === 0;

          return (
            <div
              key={`${item.time}-${idx}`}
              className={`flex flex-col items-center justify-between min-w-[76px] py-3.5 px-2 rounded-2xl border transition-all shrink-0 ${
                isCurrentHour
                  ? 'bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-500/40 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <span className={`text-xs font-semibold ${isCurrentHour ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                {hourLabel}
              </span>

              <div className="my-2.5">
                <WeatherIcon name={item.condition} isDay={item.isDay} size={26} className="w-6 h-6" />
              </div>

              <span className="text-sm font-extrabold text-slate-100 font-heading">
                {tempVal}°
              </span>

              {/* Rain pop pill if >= 5% */}
              <div className="mt-2 flex items-center gap-0.5 text-[10px] font-bold text-blue-400">
                <CloudRain className="w-3 h-3" />
                <span>{item.pop}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Smooth Recharts Forecast Graph */}
      {showChart && (
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              {chartMode === 'temp' ? `24-Hour Temperature Curve (${unitSymbol})` : '24-Hour Precipitation Probability Trend (%)'}
            </span>
          </div>

          <div className="h-36 w-full -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={3}
                />
                <YAxis
                  hide={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  domain={chartMode === 'temp' ? ['dataMin - 2', 'dataMax + 2'] : [0, 100]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-2.5 shadow-xl text-xs">
                          <p className="font-bold text-slate-200">{data.time}</p>
                          <p className="text-cyan-400 font-semibold mt-0.5">
                            Temperature: {data.temp}{unitSymbol}
                          </p>
                          <p className="text-blue-400 font-medium">
                            Rain Chance: {data.pop}%
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            {data.condition}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {chartMode === 'temp' ? (
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#tempGradient)"
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="pop"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#popGradient)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
