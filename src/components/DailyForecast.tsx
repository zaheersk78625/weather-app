import React from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { WeatherData } from '../services/weather';
import { getWeatherInfo, formatTemp } from '../lib/weather-utils';
import { useSettings } from '../contexts/SettingsContext';
import { motion } from 'motion/react';

interface DailyForecastProps {
  data: WeatherData;
}

export function DailyForecast({ data }: DailyForecastProps) {
  const { settings } = useSettings();
  const dailyData = data.daily.time.map((time, i) => ({
    time,
    tempMax: data.daily.tempMax[i],
    tempMin: data.daily.tempMin[i],
    weatherCode: data.daily.weatherCode[i],
  }));

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 mb-12">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 px-2">7-Day Forecast</h3>
      <div className="flex flex-col gap-3 px-2">
        {dailyData.map((day, index) => {
          const date = parseISO(day.time);
          const weatherInfo = getWeatherInfo(day.weatherCode, true);
          const Icon = weatherInfo.icon;

          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={day.time}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10"
            >
              <div className="flex-1">
                <span className="text-base font-medium text-gray-900 dark:text-white">
                  {isToday(date) ? 'Today' : format(date, 'EEEE')}
                </span>
              </div>
              
              <div className="flex items-center justify-center flex-1 gap-2">
                <Icon size={24} className={weatherInfo.color} />
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline-block">
                  {weatherInfo.label}
                </span>
              </div>

              <div className="flex items-center justify-end flex-1 gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Min</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatTemp(day.tempMin, settings.unit)}°</span>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-700"></div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Max</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatTemp(day.tempMax, settings.unit)}°</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
