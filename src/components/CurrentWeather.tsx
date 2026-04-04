import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Droplets, Wind, Thermometer, Sunrise, Sunset, AlertTriangle, Star, StarOff } from 'lucide-react';
import { WeatherData } from '../services/weather';
import { getWeatherInfo, formatTemp, formatTime } from '../lib/weather-utils';
import { useSettings } from '../contexts/SettingsContext';
import { SavedCity } from './CitiesModal';

interface CurrentWeatherProps {
  data: WeatherData;
}

export function CurrentWeather({ data }: CurrentWeatherProps) {
  const { settings } = useSettings();
  const { current, location, daily, alerts } = data;
  const weatherInfo = getWeatherInfo(current.weatherCode, current.isDay);
  const Icon = weatherInfo.icon;

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('weather_saved_cities');
    if (saved) {
      const cities: SavedCity[] = JSON.parse(saved);
      setIsSaved(cities.some(c => c.name === location.name && c.country === location.country));
    }
  }, [location]);

  const toggleSaveCity = () => {
    const saved = localStorage.getItem('weather_saved_cities');
    let cities: SavedCity[] = saved ? JSON.parse(saved) : [];
    
    if (isSaved) {
      cities = cities.filter(c => !(c.name === location.name && c.country === location.country));
    } else {
      cities.push({ lat: location.lat, lon: location.lon, name: location.name, country: location.country });
    }
    localStorage.setItem('weather_saved_cities', JSON.stringify(cities));
    setIsSaved(!isSaved);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {alerts && alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border ${alert.severity === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-900 dark:text-red-200' : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-900 dark:text-yellow-200'} backdrop-blur-md`}
            >
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-sm">{alert.title}</h4>
                <p className="text-sm opacity-90">{alert.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl relative"
      >
        <button 
          onClick={toggleSaveCity}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
          title={isSaved ? "Remove from saved cities" : "Save city"}
        >
          {isSaved ? <Star className="text-yellow-400 fill-yellow-400" size={24} /> : <StarOff className="text-gray-400 dark:text-gray-500" size={24} />}
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{location.name}</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">{location.country}</p>
        </div>

        <div className="flex items-center justify-center gap-6 mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Icon size={100} className={weatherInfo.color} strokeWidth={1.5} />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-7xl font-bold text-gray-900 dark:text-white tracking-tighter">
              {formatTemp(current.temp, settings.unit)}°
            </span>
            <span className="text-xl font-medium text-gray-700 dark:text-gray-300 capitalize">
              {weatherInfo.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-sm">
            <Thermometer size={24} className="text-orange-500 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Feels Like</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatTemp(current.feelsLike, settings.unit)}°</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-sm">
            <Droplets size={24} className="text-blue-500 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Humidity</span>
            <span className="font-semibold text-gray-900 dark:text-white">{current.humidity}%</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-sm">
            <Wind size={24} className="text-teal-500 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Wind</span>
            <span className="font-semibold text-gray-900 dark:text-white">{current.windSpeed} km/h</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-sm">
            <Sunrise size={24} className="text-yellow-500 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Sunrise</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatTime(new Date(daily.sunrise[0]), settings.timeFormat)}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-sm">
            <Sunset size={24} className="text-orange-400 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Sunset</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatTime(new Date(daily.sunset[0]), settings.timeFormat)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
