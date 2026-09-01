import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { WeatherIcon } from './WeatherIcon';
import { formatTemp, formatTime, formatFullDate } from '../utils/weatherUtils';
import { ArrowUp, ArrowDown, Droplets, Wind, SunMedium, Navigation, Loader2, Share2, Check } from 'lucide-react';

export const CurrentWeatherCard: React.FC = () => {
  const { weather, location, settings, autoDetectLocation, isDetectingLocation } = useWeather();
  const [copied, setCopied] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!weather) return null;

  const current = weather.current;
  const tempFormatted = formatTemp(current.temp, settings.temperatureUnit);
  const feelsLikeFormatted = formatTemp(current.feelsLike, settings.temperatureUnit);
  const tempHighFormatted = formatTemp(current.tempHigh, settings.temperatureUnit);
  const tempLowFormatted = formatTemp(current.tempLow, settings.temperatureUnit);

  const cityName = location?.city || 'Local Location';
  const regionName = location?.state ? `${location.state}, ` : '';
  const countryName = location?.country || '';
  const fullLocationName = `${cityName}${regionName ? ', ' + regionName.replace(/,\s*$/, '') : ''}${countryName ? ', ' + countryName : ''}`;

  const handleShare = async () => {
    const summaryText = `🌤️ Weather in ${fullLocationName}: ${tempFormatted} (${current.condition}), Feels like ${feelsLikeFormatted}. High: ${tempHighFormatted} / Low: ${tempLowFormatted}. Humidity: ${current.humidity}%, Wind: ${current.windSpeed} km/h.`;
    const shareData = {
      title: `Weather in ${cityName} • ${tempFormatted}`,
      text: summaryText,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareFeedback('Shared successfully!');
        setTimeout(() => setShareFeedback(null), 3000);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Fallback to clipboard if sharing fails
          await copyToClipboard(summaryText);
        }
      }
    } else {
      await copyToClipboard(summaryText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers / iframe restrictions
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setShareFeedback('Weather summary copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setShareFeedback(null);
      }, 3500);
    } catch (e) {
      setShareFeedback('Unable to share weather summary.');
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/90 border border-slate-800/80 p-6 shadow-2xl backdrop-blur-xl">
      {/* Subtle atmospheric glow background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info: Location, Badges & Actions */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-heading truncate">
              {location?.city || 'Hyderabad'}
            </h2>

            {/* Auto-detected location badge */}
            {location?.isGps ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                <Navigation className="w-2.5 h-2.5" /> GPS
              </span>
            ) : location?.isIp ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> Network IP
              </span>
            ) : (
              <button
                onClick={() => autoDetectLocation(true)}
                disabled={isDetectingLocation}
                title="Auto-Detect My Current Location"
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 transition-colors border border-slate-700 shrink-0"
              >
                {isDetectingLocation ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                ) : (
                  <Navigation className="w-2.5 h-2.5" />
                )}
                Auto-detect
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5 truncate">
            {location?.state ? `${location.state}, ` : ''}{location?.country || 'India'}
          </p>
          <p className="text-[11px] text-cyan-400 font-semibold mt-1">
            {formatFullDate()}
          </p>
        </div>

        {/* Action Buttons: Share & Weather Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            title="Share weather summary via mobile sheet or copy link"
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-all shadow-md flex items-center justify-center group"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Large Animated Weather Icon */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 shadow-inner">
            <WeatherIcon name={current.condition} isDay={current.isDay} size={48} className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Share Toast Banner if Triggered */}
      {shareFeedback && (
        <div className="relative z-10 mt-3 p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 animate-fadeIn shadow-lg">
          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{shareFeedback}</span>
        </div>
      )}

      {/* Main Temperature & Condition Display */}
      <div className="relative z-10 my-5 flex flex-col items-start">
        <div className="flex items-baseline gap-3">
          <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-slate-50 font-heading">
            {tempFormatted}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-base sm:text-lg font-bold text-slate-200">
            {current.condition}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            • Feels like {feelsLikeFormatted}
          </span>
        </div>

        {/* High & Low Range Pills */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20">
            <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
            <span>H: {tempHighFormatted}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/20">
            <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
            <span>L: {tempLowFormatted}</span>
          </div>
        </div>
      </div>

      {/* Quick Status Ticker */}
      <div className="relative z-10 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
          <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Humidity</p>
            <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{current.humidity}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
          <Wind className="w-4 h-4 text-teal-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Wind</p>
            <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{current.windSpeed} km/h</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
          <SunMedium className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">UV Index</p>
            <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{current.uvIndex} ({current.uvDescription})</p>
          </div>
        </div>
      </div>
    </div>
  );
};
