import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import { useAuth } from '../context/AuthContext';
import { weatherApi } from '../services/api';
import { WeatherIcon } from './WeatherIcon';
import { formatTemp } from '../utils/weatherUtils';
import {
  Heart,
  Plus,
  Trash2,
  MapPin,
  Search,
  Check,
  Sparkles,
  CloudSun,
  X
} from 'lucide-react';
import { FavoriteCity, SearchCityResult, LocationInfo } from '../types';

interface FavWeatherSummary {
  temp: number;
  condition: string;
  isDay: boolean;
  tempHigh: number;
  tempLow: number;
}

export const FavoritesView: React.FC = () => {
  const { favorites, removeFavorite, addFavorite, setLocationAndFetch, setActiveTab, settings } = useWeather();
  const { isAuthenticated, user } = useAuth();

  const [weatherSummaries, setWeatherSummaries] = useState<Record<number, FavWeatherSummary>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchCityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch quick weather summaries for favorites
  useEffect(() => {
    async function loadSummaries() {
      const summaries: Record<number, FavWeatherSummary> = {};
      for (const fav of favorites) {
        try {
          const data = await weatherApi.getWeatherByCoords(fav.latitude, fav.longitude);
          summaries[fav.id] = {
            temp: data.current.temp,
            condition: data.current.condition,
            isDay: data.current.isDay,
            tempHigh: data.current.tempHigh,
            tempLow: data.current.tempLow,
          };
        } catch (e) {
          // ignore individual city failure
        }
      }
      setWeatherSummaries(summaries);
    }
    if (favorites.length > 0) {
      loadSummaries();
    }
  }, [favorites]);

  // Autocomplete search inside add modal
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await weatherApi.searchCities(searchQuery);
        setSuggestions(results);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectFav = (fav: FavoriteCity) => {
    const loc: LocationInfo = {
      city: fav.city,
      country: fav.country,
      state: fav.state,
      displayName: `${fav.city}${fav.state ? ', ' + fav.state : ''}${fav.country ? ', ' + fav.country : ''}`,
      latitude: fav.latitude,
      longitude: fav.longitude,
      isGps: false,
    };
    setLocationAndFetch(loc);
    setActiveTab('home');
  };

  const handleAddCity = async (item: SearchCityResult) => {
    const loc: LocationInfo = {
      city: item.name,
      state: item.admin1,
      country: item.country,
      displayName: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}`,
      latitude: item.latitude,
      longitude: item.longitude,
      isGps: false,
    };
    await addFavorite(loc);
    setIsAddOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-heading flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            Favorite Cities
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {isAuthenticated ? `Synced to ${user?.email}` : 'Quick access saved destinations'}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add City</span>
        </button>
      </div>

      {/* Add City Modal */}
      {isAddOpen && (
        <div className="rounded-2xl bg-slate-900 border border-slate-700/80 p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              Search and Add Favorite City
            </h3>
            <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type city name (e.g. Khammam, Vijayawada, Tokyo, Paris)..."
              className="w-full px-3.5 py-2 text-xs bg-slate-950 text-slate-100 rounded-xl border border-slate-800 focus:border-cyan-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Search suggestions list */}
          {suggestions.length > 0 && (
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/80 bg-slate-950/80 rounded-xl border border-slate-800 no-scrollbar">
              {suggestions.map((item) => (
                <button
                  key={`${item.id}-${item.latitude}`}
                  onClick={() => handleAddCity(item)}
                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-cyan-500/10 text-xs text-slate-200 group"
                >
                  <span className="font-semibold text-slate-100 group-hover:text-cyan-300">
                    {item.name}, <span className="text-slate-400 font-normal">{item.admin1 || item.country}</span>
                  </span>
                  <Plus className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List of Favorite Cards */}
      {favorites.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No favorite cities added yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Search for any city like Hyderabad, Mumbai or Bengaluru and tap the heart icon to save it here.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all"
          >
            Add Your First City
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {favorites.map((fav) => {
            const summary = weatherSummaries[fav.id];
            const tempStr = summary ? formatTemp(summary.temp, settings.temperatureUnit) : '--°';
            const highStr = summary ? formatTemp(summary.tempHigh, settings.temperatureUnit) : '';
            const lowStr = summary ? formatTemp(summary.tempLow, settings.temperatureUnit) : '';

            return (
              <div
                key={fav.id}
                className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-slate-800/80 p-4 backdrop-blur-xl shadow-lg hover:border-slate-700 transition-all group"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => handleSelectFav(fav)}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <h3 className="text-base font-bold text-slate-100 font-heading">
                        {fav.city}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {fav.state ? `${fav.state}, ` : ''}{fav.country || 'Saved Location'}
                    </p>
                    <p className="text-[11px] text-cyan-400 font-medium mt-1">
                      {summary ? summary.condition : 'Loading live weather...'}
                    </p>
                  </div>

                  {/* Right: Temp & Icon */}
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-black text-slate-100 font-heading">
                      {tempStr}
                    </div>
                    {summary && (
                      <div className="my-1">
                        <WeatherIcon name={summary.condition} isDay={summary.isDay} size={24} className="w-5 h-5" />
                      </div>
                    )}
                    {summary && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        H:{highStr} L:{lowStr}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                  <button
                    onClick={() => handleSelectFav(fav)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View Full Forecast →
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(fav.id);
                    }}
                    title="Remove Favorite"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
