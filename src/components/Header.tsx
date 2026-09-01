import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Compass,
  RotateCw,
  Heart,
  X,
  Sparkles,
  Loader2,
  Navigation,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { weatherApi } from '../services/api';
import { SearchCityResult, LocationInfo } from '../types';
import { formatTime } from '../utils/weatherUtils';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export const Header: React.FC = () => {
  const {
    location,
    weather,
    isRefreshing,
    isDetectingLocation,
    locationMessage,
    refreshWeather,
    autoDetectLocation,
    requestGpsLocation,
    setLocationAndFetch,
    isCurrentFavorite,
    toggleFavoriteCurrent,
    settings,
    updateSettings,
  } = useWeather();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchCityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState<string | null>(null);
  const [voiceSuccessMessage, setVoiceSuccessMessage] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced Autocomplete Search
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
      } catch (err) {
        console.warn('Autocomplete search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (result: SearchCityResult) => {
    const loc: LocationInfo = {
      city: result.name,
      state: result.admin1,
      country: result.country,
      displayName: `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`,
      latitude: result.latitude,
      longitude: result.longitude,
      isGps: false,
    };
    setLocationAndFetch(loc);
    setSearchQuery('');
    setSuggestions([]);
    setIsSearchOpen(false);
    setVoiceStatusMessage(null);
    setVoiceSuccessMessage(null);
  };

  // Web Speech API Integration
  const handleVoiceSearchResult = async (extractedCity: string, rawTranscript: string) => {
    const query = extractedCity || rawTranscript;
    if (!query || query.trim().length === 0) {
      setVoiceStatusMessage('Could not understand city name. Please try again.');
      return;
    }

    setSearchQuery(query);
    setIsSearchOpen(true);
    setIsSearching(true);
    setVoiceStatusMessage(`Heard: "${rawTranscript}" → Searching "${query}"...`);

    try {
      const results = await weatherApi.searchCities(query);
      setSuggestions(results);

      if (results && results.length > 0) {
        const topMatch = results[0];
        setVoiceSuccessMessage(`Found ${topMatch.name}, ${topMatch.admin1 || topMatch.country || ''}! Loading weather...`);
        
        // If there's an exact or high confidence top match, auto-navigate
        if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = setTimeout(() => {
          handleSelectCity(topMatch);
        }, 1200);
      } else {
        setVoiceStatusMessage(`No exact weather station found for "${query}". Try speaking a nearby major city.`);
      }
    } catch (err) {
      console.warn('Voice city search error:', err);
      setVoiceStatusMessage(`Search failed for "${query}". Please type to search.`);
    } finally {
      setIsSearching(false);
    }
  };

  const {
    isListening,
    interimTranscript,
    isSupported: isSpeechSupported,
    errorMessage: speechError,
    startListening,
    stopListening,
    setErrorMessage: setSpeechError,
  } = useSpeechRecognition({
    onResult: handleVoiceSearchResult,
    onError: (err) => {
      setVoiceStatusMessage(err);
      if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = setTimeout(() => {
        setVoiceStatusMessage(null);
        setSpeechError(null);
      }, 5000);
    },
  });

  const toggleVoiceSearch = () => {
    setVoiceStatusMessage(null);
    setVoiceSuccessMessage(null);
    if (voiceTimeoutRef.current) clearTimeout(voiceTimeoutRef.current);

    if (isListening) {
      stopListening();
    } else {
      if (!isSpeechSupported) {
        setVoiceStatusMessage('Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
        setTimeout(() => setVoiceStatusMessage(null), 5000);
        return;
      }
      setIsSearchOpen(true);
      startListening();
    }
  };

  const handleToggleUnit = () => {
    const nextUnit = settings.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    updateSettings({ temperatureUnit: nextUnit });
  };

  const lastUpdatedTime = weather?.lastUpdated ? formatTime(weather.lastUpdated) : 'Just now';

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 transition-all duration-300">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Top bar: Location, Quick Actions, Unit Toggle */}
        <div className="flex items-center justify-between gap-2">
          {/* Location Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => autoDetectLocation(true)}
              disabled={isDetectingLocation}
              title="Auto-Detect User Location (GPS & Network IP)"
              className={`p-2 rounded-xl transition-all relative ${
                isDetectingLocation
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 animate-pulse ring-2 ring-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : location?.isGps
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                  : location?.isIp
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {isDetectingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
              ) : (
                <Navigation className={`w-4 h-4 ${location?.isGps || location?.isIp ? 'animate-pulse' : ''}`} />
              )}
            </button>

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-slate-100 truncate tracking-tight">
                  {location?.city || 'Locating...'}
                </h1>
                {location?.isGps ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    GPS
                  </span>
                ) : location?.isIp ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Network IP
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {location?.state ? `${location.state}, ` : ''}{location?.country || 'Live Weather'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Unit Toggle, Favorite, Refresh */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Unit Toggle Button */}
            <button
              onClick={handleToggleUnit}
              title="Toggle °C / °F"
              className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900/80 text-slate-200 border border-slate-800 hover:border-slate-700 active:scale-95 transition-all"
            >
              {settings.temperatureUnit === 'celsius' ? '°C' : '°F'}
            </button>

            {/* Favorite Button */}
            <button
              onClick={toggleFavoriteCurrent}
              title={isCurrentFavorite ? 'Remove from favorites' : 'Save to favorites'}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isCurrentFavorite
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-rose-400 border-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-rose-400' : ''}`} />
            </button>

            {/* Refresh Button */}
            <button
              onClick={refreshWeather}
              disabled={isRefreshing}
              title={`Last updated ${lastUpdatedTime}`}
              className="p-2 rounded-xl bg-slate-900/80 text-slate-300 border border-slate-800 hover:text-cyan-400 hover:border-slate-700 active:scale-95 transition-all disabled:opacity-60"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* City Search Bar with Autocomplete Dropdown & Voice Microphone */}
        <div ref={searchRef} className="relative mt-2.5">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder={isListening ? 'Listening for city name (e.g. "Hyderabad", "Tokyo")...' : 'Search city or speak via mic...'}
              className={`w-full pl-9 pr-16 py-2 text-xs md:text-sm bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl border transition-all focus:outline-none ${
                isListening
                  ? 'border-cyan-400 ring-2 ring-cyan-500/30 bg-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'border-slate-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'
              }`}
            />

            {/* Right Controls: Clear button + Microphone button */}
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setVoiceStatusMessage(null);
                    setVoiceSuccessMessage(null);
                  }}
                  title="Clear search"
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Hands-Free Voice Search Microphone Button */}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                title={isListening ? 'Stop voice listening' : 'Hands-free voice search (Tap to speak city)'}
                className={`p-1.5 rounded-lg transition-all relative ${
                  isListening
                    ? 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/30 scale-105 animate-pulse'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
                }`}
              >
                {isListening ? (
                  <span className="relative flex items-center justify-center">
                    <span className="absolute -inset-1 rounded-full bg-rose-400/40 animate-ping" />
                    <Mic className="w-4 h-4 text-white relative z-10" />
                  </span>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Active Voice Listening Soundwave & Interim Pill */}
          {isListening && (
            <div className="mt-2 p-2.5 rounded-xl bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 border border-cyan-500/40 flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-cyan-300 truncate">
                    {interimTranscript ? `"${interimTranscript}"` : 'Listening for voice command...'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Try: "Weather in Hyderabad", "Mumbai", "Tokyo forecast"
                  </p>
                </div>
              </div>

              <button
                onClick={stopListening}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 shrink-0 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Voice Search Feedback / Success Notification Banner */}
          {voiceSuccessMessage && (
            <div className="mt-2 p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-md animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{voiceSuccessMessage}</span>
            </div>
          )}

          {/* Voice Search Warning / Error Message Banner */}
          {voiceStatusMessage && !voiceSuccessMessage && !isListening && (
            <div className="mt-2 p-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-2 shadow-md animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{voiceStatusMessage}</span>
              </div>
              <button
                onClick={() => setVoiceStatusMessage(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Location Detection Notification Banner */}
          {locationMessage && !isListening && (
            <div className="mt-2 p-2 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between gap-2 shadow-md animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                {isDetectingLocation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
                <span className="truncate">{locationMessage}</span>
              </div>
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl shadow-slate-950/80 z-50 divide-y divide-slate-800/60 no-scrollbar">
              {/* Quick Auto-Detect Location Button in Dropdown */}
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                  setSuggestions([]);
                  autoDetectLocation(true);
                }}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-left bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Navigation className={`w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <div>
                    <p className="text-xs font-bold text-cyan-200">Auto-Detect My Current Location</p>
                    <p className="text-[10px] text-cyan-400/80">Use live GPS or Network IP to detect weather</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300">
                  Detect
                </span>
              </button>

              {isSearching ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  Searching global locations...
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <button
                    key={`${item.id}-${item.latitude}-${item.longitude}`}
                    onClick={() => handleSelectCity(item)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-cyan-500/10 hover:text-cyan-200 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="truncate">
                        <span className="text-xs md:text-sm font-semibold text-slate-100 group-hover:text-cyan-200">
                          {item.name}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5">
                          {item.admin1 ? `${item.admin1}, ` : ''}{item.country || ''}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                      {item.latitude.toFixed(1)}°, {item.longitude.toFixed(1)}°
                    </span>
                  </button>
                ))
              ) : searchQuery.trim().length >= 2 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No cities found matching "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Last updated micro pill */}
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Live Real-Time Radar & GPS
          </span>
          <span>Last updated: {lastUpdatedTime}</span>
        </div>
      </div>
    </header>
  );
};

