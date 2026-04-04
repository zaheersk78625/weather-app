import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, RefreshCw, AlertCircle, Settings, List, Clock } from 'lucide-react';
import { getWeatherData, reverseGeocode, WeatherData } from './services/weather';
import { SearchBar } from './components/SearchBar';
import { CurrentWeather } from './components/CurrentWeather';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { getWeatherInfo } from './lib/weather-utils';
import { motion, AnimatePresence } from 'motion/react';
import { SettingsProvider } from './contexts/SettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { CitiesModal } from './components/CitiesModal';
import { format } from 'date-fns';

function WeatherApp() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lon: number, name: string, country: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCitiesOpen, setIsCitiesOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Default location (e.g., London) if geolocation fails or is denied
  const defaultLocation = { lat: 51.5074, lon: -0.1278, name: 'London', country: 'United Kingdom' };

  const fetchWeather = useCallback(async (lat: number, lon: number, name: string, country: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getWeatherData(lat, lon, name, country);
      if (data) {
        setWeatherData(data);
        setCurrentCoords({ lat, lon, name, country });
        setLastUpdated(new Date());
      } else {
        setError("Failed to fetch weather data.");
      }
    } catch (err) {
      setError("An error occurred while fetching weather data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCurrentLocation = useCallback(() => {
    setIsLocating(true);
    setError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const { name, country } = await reverseGeocode(latitude, longitude);
          await fetchWeather(latitude, longitude, name, country);
          setIsLocating(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Location access denied or unavailable. Showing default location.");
          fetchWeather(defaultLocation.lat, defaultLocation.lon, defaultLocation.name, defaultLocation.country);
          setIsLocating(false);
        },
        { timeout: 10000 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      fetchWeather(defaultLocation.lat, defaultLocation.lon, defaultLocation.name, defaultLocation.country);
      setIsLocating(false);
    }
  }, [fetchWeather]);

  useEffect(() => {
    // Check system preference for dark mode initially
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    handleCurrentLocation();
  }, [handleCurrentLocation]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auto refresh every 5 minutes for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentCoords) {
        fetchWeather(currentCoords.lat, currentCoords.lon, currentCoords.name, currentCoords.country);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentCoords, fetchWeather]);

  const handleLocationSelect = (lat: number, lon: number, name: string, country: string) => {
    fetchWeather(lat, lon, name, country);
  };

  const handleRefresh = () => {
    if (currentCoords) {
      fetchWeather(currentCoords.lat, currentCoords.lon, currentCoords.name, currentCoords.country);
    }
  };

  // Determine background gradient based on current weather
  let bgGradient = isDarkMode ? "from-gray-900 to-black" : "from-blue-100 to-white";
  if (weatherData) {
    const info = getWeatherInfo(weatherData.current.weatherCode, weatherData.current.isDay);
    bgGradient = isDarkMode ? info.darkBgGradient : info.bgGradient;
  }

  return (
    <div className={`min-h-screen transition-colors duration-1000 ease-in-out bg-gradient-to-br ${bgGradient}`}>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Weather<span className="text-blue-500">Now</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsCitiesOpen(true)}
              className="p-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
              title="Manage Cities"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
              title="Refresh weather"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md text-gray-800 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
              title="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="mb-8">
          <SearchBar 
            onLocationSelect={handleLocationSelect} 
            onCurrentLocation={handleCurrentLocation}
            isLocating={isLocating}
          />
        </div>

        {/* Last Updated */}
        {lastUpdated && !isLoading && (
          <div className="flex justify-center items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <Clock size={14} />
            <span>Last updated: {format(lastUpdated, 'h:mm a')}</span>
          </div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-8 flex items-center gap-3 max-w-md mx-auto"
            >
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {isLoading && !weatherData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw size={40} className="animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Fetching weather data...</p>
          </div>
        ) : weatherData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CurrentWeather data={weatherData} />
            <HourlyForecast data={weatherData} />
            <DailyForecast data={weatherData} />
          </motion.div>
        ) : null}

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <CitiesModal 
          isOpen={isCitiesOpen} 
          onClose={() => setIsCitiesOpen(false)} 
          onSelectCity={handleLocationSelect}
          currentCoords={currentCoords}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <WeatherApp />
    </SettingsProvider>
  );
}
