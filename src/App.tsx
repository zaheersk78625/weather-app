/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { WeatherProvider, useWeather } from './context/WeatherContext';
import { WeatherBackground } from './components/WeatherBackground';
import { Header } from './components/Header';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { WeatherDetailsGrid } from './components/WeatherDetailsGrid';
import { WeatherAlertsBanner } from './components/WeatherAlertsBanner';
import { WeatherMap } from './components/WeatherMap';
import { FavoritesView } from './components/FavoritesView';
import { ForecastView } from './components/ForecastView';
import { SettingsView } from './components/SettingsView';
import { BottomNavigation } from './components/BottomNavigation';
import { AuthModal } from './components/AuthModal';
import { SkeletonLoader } from './components/SkeletonLoader';
import { ErrorView } from './components/ErrorView';

const MainContent: React.FC = () => {
  const { weather, isLoading, error, permissionDenied, activeTab } = useWeather();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const bgType = weather?.current?.bgType || 'sunny';
  const isDay = weather?.current?.isDay ?? true;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Weather Particle Background */}
      <WeatherBackground bgType={bgType} isDay={isDay} />

      {/* Top App Header with Search, GPS, and Actions */}
      <Header />

      {/* Main Screen Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-4 pb-24 md:pb-12">
        {isLoading && !weather ? (
          <SkeletonLoader />
        ) : error && !weather ? (
          <ErrorView message={error} isPermissionDenied={permissionDenied} />
        ) : (
          <div>
            {/* TAB 1: HOME DASHBOARD */}
            {activeTab === 'home' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Severe Weather Alerts if any */}
                <WeatherAlertsBanner />

                {/* Hero Current Weather Card */}
                <CurrentWeatherCard />

                {/* Horizontally Scrollable Hourly Forecast + Recharts Trend */}
                <HourlyForecast />

                {/* 7-Day Weekly Forecast Section */}
                <DailyForecast />

                {/* Separate Detail Metric Cards (Humidity, Wind, UV, Visibility, Pressure, Sunrise/Sunset) */}
                <WeatherDetailsGrid />
              </div>
            )}

            {/* TAB 2: EXTENDED FORECAST */}
            {activeTab === 'forecast' && (
              <div className="animate-fadeIn">
                <ForecastView />
              </div>
            )}

            {/* TAB 3: RADAR WEATHER MAP */}
            {activeTab === 'map' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-heading">
                      Interactive Radar & Map
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Live precipitation, cloud coverage, temperature heatmap & wind velocity
                    </p>
                  </div>
                </div>
                <WeatherMap />
              </div>
            )}

            {/* TAB 4: SAVED FAVORITES */}
            {activeTab === 'favorites' && (
              <div className="animate-fadeIn">
                <FavoritesView />
              </div>
            )}

            {/* TAB 5: APP SETTINGS */}
            {activeTab === 'settings' && (
              <div className="animate-fadeIn">
                <SettingsView onOpenAuth={() => setIsAuthOpen(true)} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNavigation />

      {/* User Login / Register Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WeatherProvider>
        <MainContent />
      </WeatherProvider>
    </AuthProvider>
  );
}
