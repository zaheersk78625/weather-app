import React from 'react';
import { parseISO } from 'date-fns';
import { WeatherData } from '../services/weather';
import { getWeatherInfo, formatTemp, formatHour } from '../lib/weather-utils';
import { useSettings } from '../contexts/SettingsContext';
import { motion } from 'motion/react';

interface HourlyForecastProps {
  data: WeatherData;
}

export function HourlyForecast({ data }: HourlyForecastProps) {
  const { settings } = useSettings();
  // Get next 24 hours
  const now = new Date();
  const currentIndex = data.hourly.time.findIndex(t => new Date(t) >= now);
  const startIndex = currentIndex !== -1 ? currentIndex : 0;
  
  const hourlyData = data.hourly.time.slice(startIndex, startIndex + 24).map((time, i) => ({
    time,
    temp: data.hourly.temp[startIndex + i],
    weatherCode: data.hourly.weatherCode[startIndex + i],
  }));

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 px-2">Hourly Forecast</h3>
      <div className="flex overflow-x-auto pb-4 pt-2 hide-scrollbar gap-4 px-2">
        {hourlyData.map((hour, index) => {
          const date = parseISO(hour.time);
          const isDay = date.getHours() >= 6 && date.getHours() <= 18;
          const weatherInfo = getWeatherInfo(hour.weatherCode, isDay);
          const Icon = weatherInfo.icon;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={hour.time}
              className="flex flex-col items-center min-w-[80px] p-4 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 shrink-0"
            >
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                {formatHour(date, settings.timeFormat)}
              </span>
              <Icon size={28} className={`${weatherInfo.color} mb-2`} />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatTemp(hour.temp, settings.unit)}°
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
