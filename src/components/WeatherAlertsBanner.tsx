import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Info } from 'lucide-react';

export const WeatherAlertsBanner: React.FC = () => {
  const { weather } = useWeather();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!weather || !weather.alerts || weather.alerts.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3">
      {weather.alerts.map((alert) => {
        const isExpanded = expandedId === alert.id;
        const isExtreme = alert.severity === 'extreme';
        const isSevere = alert.severity === 'severe';

        const borderClass = isExtreme
          ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/60 via-slate-900/80 to-slate-950/90'
          : isSevere
          ? 'border-orange-500/40 bg-gradient-to-r from-orange-950/60 via-slate-900/80 to-slate-950/90'
          : 'border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950/90';

        const textBadgeClass = isExtreme
          ? 'bg-rose-500 text-slate-950 font-extrabold'
          : isSevere
          ? 'bg-orange-500 text-slate-950 font-bold'
          : 'bg-amber-500 text-slate-950 font-bold';

        return (
          <div
            key={alert.id}
            className={`rounded-2xl border p-4 backdrop-blur-xl shadow-lg transition-all ${borderClass}`}
          >
            <div
              className="flex items-start justify-between gap-3 cursor-pointer select-none"
              onClick={() => toggleExpand(alert.id)}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-700/60 shrink-0 mt-0.5">
                  <AlertTriangle className={`w-5 h-5 ${isExtreme ? 'text-rose-400 animate-bounce' : isSevere ? 'text-orange-400' : 'text-amber-400'}`} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${textBadgeClass}`}>
                      {alert.event}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Urgency: <strong className="text-slate-200">{alert.urgency}</strong>
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-1">
                    {alert.headline}
                  </h4>
                </div>
              </div>

              <button className="p-1 text-slate-400 hover:text-slate-200 shrink-0">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expandable Alert description */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 space-y-2">
                <p className="leading-relaxed">{alert.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Stay tuned to local civil meteorological alerts and adhere to emergency guidelines.</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
