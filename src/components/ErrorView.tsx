import React from 'react';
import { AlertCircle, WifiOff, MapPinOff, RefreshCw, Search, Navigation, Loader2 } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';

interface ErrorViewProps {
  message?: string;
  isPermissionDenied?: boolean;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, isPermissionDenied }) => {
  const { refreshWeather, autoDetectLocation, isDetectingLocation, setLocationAndFetch } = useWeather();

  const isNetwork = message?.toLowerCase().includes('internet') || message?.toLowerCase().includes('network') || !navigator.onLine;

  const handleSelectDefaultCity = (cityName: string, lat: number, lon: number) => {
    setLocationAndFetch({
      city: cityName,
      displayName: `${cityName}, India`,
      latitude: lat,
      longitude: lon,
      isGps: false,
    });
  };

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 text-center backdrop-blur-xl shadow-2xl space-y-4 max-w-md mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        {isPermissionDenied ? (
          <MapPinOff className="w-7 h-7" />
        ) : isNetwork ? (
          <WifiOff className="w-7 h-7" />
        ) : (
          <AlertCircle className="w-7 h-7" />
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-100">
          {isPermissionDenied
            ? 'Location Permission Needed'
            : isNetwork
            ? 'Internet Unavailable'
            : 'Unable to Fetch Real-Time Weather'}
        </h3>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          {message || 'Unable to fetch weather. Check your internet connection and try again.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
        <button
          onClick={() => autoDetectLocation(true)}
          disabled={isDetectingLocation}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isDetectingLocation ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{isDetectingLocation ? 'Auto-Detecting...' : 'Auto-Detect My Location'}</span>
        </button>

        <button
          onClick={refreshWeather}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Select Preset Indian & Global Cities */}
      <div className="pt-4 border-t border-slate-800/80">
        <p className="text-[11px] text-slate-500 mb-2 font-semibold uppercase">Or choose a city directly:</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => handleSelectDefaultCity('Hyderabad', 17.3850, 78.4867)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs hover:bg-cyan-500/20 hover:text-cyan-300"
          >
            Hyderabad
          </button>
          <button
            onClick={() => handleSelectDefaultCity('Khammam', 17.2473, 80.1514)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs hover:bg-cyan-500/20 hover:text-cyan-300"
          >
            Khammam
          </button>
          <button
            onClick={() => handleSelectDefaultCity('Vijayawada', 16.5062, 80.6480)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs hover:bg-cyan-500/20 hover:text-cyan-300"
          >
            Vijayawada
          </button>
          <button
            onClick={() => handleSelectDefaultCity('Mumbai', 19.0760, 72.8777)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs hover:bg-cyan-500/20 hover:text-cyan-300"
          >
            Mumbai
          </button>
          <button
            onClick={() => handleSelectDefaultCity('Bengaluru', 12.9716, 77.5946)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs hover:bg-cyan-500/20 hover:text-cyan-300"
          >
            Bengaluru
          </button>
        </div>
      </div>
    </div>
  );
};
