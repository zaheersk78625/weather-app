import React, { useEffect, useRef, useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import {
  Layers,
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CloudRain,
  Thermometer,
  Cloud,
  Wind
} from 'lucide-react';
import L from 'leaflet';

export const WeatherMap: React.FC = () => {
  const { location, weather, setLocationAndFetch, favorites } = useWeather();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<'precipitation' | 'temp' | 'clouds' | 'wind'>('precipitation');
  const [mapZoom, setMapZoom] = useState<number>(7);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = location?.latitude || 17.3850;
    const initialLon = location?.longitude || 78.4867;

    // Create Map if not created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark Mode Tile Layer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      markerGroupRef.current = markerGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center & markers when location or activeLayer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup || !location) return;

    map.setView([location.latitude, location.longitude], map.getZoom(), { animate: true });

    markerGroup.clearLayers();

    // Custom Current Location Marker Icon
    const currentLocationIcon = L.divIcon({
      className: 'custom-gps-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></div>
          <div class="w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const currentMarker = L.marker([location.latitude, location.longitude], { icon: currentLocationIcon })
      .bindPopup(`
        <div class="text-slate-900 font-sans p-1">
          <p class="font-bold text-sm">${location.city}</p>
          <p class="text-xs text-slate-600">${weather ? `${weather.current.temp}°C • ${weather.current.condition}` : 'Active Location'}</p>
        </div>
      `);
    markerGroup.addLayer(currentMarker);

    // Add Markers for Favorite Cities
    favorites.forEach((fav) => {
      if (Math.abs(fav.latitude - location.latitude) > 0.05 || Math.abs(fav.longitude - location.longitude) > 0.05) {
        const favIcon = L.divIcon({
          className: 'custom-fav-pin',
          html: `
            <div class="w-4 h-4 rounded-full bg-rose-500 border border-white shadow-md flex items-center justify-center text-[8px] text-white">
              ♥
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const favMarker = L.marker([fav.latitude, fav.longitude], { icon: favIcon })
          .bindPopup(`
            <div class="text-slate-900 font-sans p-1">
              <p class="font-bold text-xs">${fav.city}</p>
              <p class="text-[10px] text-slate-500">Favorite Location</p>
            </div>
          `);
        
        favMarker.on('click', () => {
          setLocationAndFetch({
            city: fav.city,
            country: fav.country,
            state: fav.state,
            displayName: `${fav.city}${fav.country ? ', ' + fav.country : ''}`,
            latitude: fav.latitude,
            longitude: fav.longitude,
            isGps: false,
          });
        });

        markerGroup.addLayer(favMarker);
      }
    });
  }, [location, weather, favorites, setLocationAndFetch]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleCenterGps = () => {
    if (mapInstanceRef.current && location) {
      mapInstanceRef.current.setView([location.latitude, location.longitude], 9, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-[580px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Map Bar: Weather Layer Switcher */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-1 rounded-2xl shadow-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveLayer('precipitation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeLayer === 'precipitation'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Radar</span>
          </button>

          <button
            onClick={() => setActiveLayer('temp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeLayer === 'temp'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={() => setActiveLayer('clouds')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeLayer === 'clouds'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Clouds</span>
          </button>

          <button
            onClick={() => setActiveLayer('wind')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeLayer === 'wind'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind</span>
          </button>
        </div>
      </div>

      {/* Floating Zoom & GPS Controls */}
      <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleCenterGps}
          title="Center My Location"
          className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 shadow-xl transition-all"
        >
          <Navigation className="w-5 h-5" />
        </button>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 text-slate-200 hover:text-white active:scale-95 shadow-xl transition-all"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 text-slate-200 hover:text-white active:scale-95 shadow-xl transition-all"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold text-slate-300">
          <span>
            {activeLayer === 'precipitation' && 'Precipitation Intensity (mm/h)'}
            {activeLayer === 'temp' && 'Temperature Gradient (°C)'}
            {activeLayer === 'clouds' && 'Cloud Cover Fraction (%)'}
            {activeLayer === 'wind' && 'Wind Speed Velocity (km/h)'}
          </span>
          <span className="text-cyan-400 font-mono text-[10px]">
            {location?.city || 'Radar Live'}
          </span>
        </div>

        {/* Legend Gradient Bar */}
        {activeLayer === 'precipitation' && (
          <div>
            <div className="w-full h-2 rounded-full bg-gradient-to-r from-emerald-400 via-blue-500 via-purple-500 to-rose-600" />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
              <span>Light (0.1)</span>
              <span>Moderate (2.5)</span>
              <span>Heavy (10+)</span>
              <span>Extreme (30+)</span>
            </div>
          </div>
        )}

        {activeLayer === 'temp' && (
          <div>
            <div className="w-full h-2 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-rose-600" />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
              <span>-10°C</span>
              <span>10°C</span>
              <span>25°C</span>
              <span>45°C+</span>
            </div>
          </div>
        )}

        {activeLayer === 'clouds' && (
          <div>
            <div className="w-full h-2 rounded-full bg-gradient-to-r from-slate-800 via-sky-400 to-slate-100" />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
              <span>Clear (0%)</span>
              <span>Scattered (40%)</span>
              <span>Overcast (100%)</span>
            </div>
          </div>
        )}

        {activeLayer === 'wind' && (
          <div>
            <div className="w-full h-2 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500" />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
              <span>Calm (0)</span>
              <span>Breeze (20)</span>
              <span>Gale (60+)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
