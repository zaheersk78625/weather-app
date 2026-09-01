import React from 'react';
import { useWeather } from '../context/WeatherContext';
import { Home, Calendar, Map, Heart, Settings } from 'lucide-react';
import { TabType } from '../types';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, favorites } = useWeather();

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'forecast', label: 'Forecast', icon: Calendar },
    { id: 'map', label: 'Radar Map', icon: Map },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-slate-800/80 safe-area-inset-bottom">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl min-w-[56px] min-h-[44px] transition-all relative select-none ${
                isActive
                  ? 'text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute -top-2 w-8 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.id === 'favorites' && favorites.length > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-extrabold flex items-center justify-center border border-slate-950">
                    {favorites.length}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
