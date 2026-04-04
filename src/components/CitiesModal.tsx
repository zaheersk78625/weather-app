import React, { useState, useEffect } from 'react';
import { X, Trash2, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export interface SavedCity {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

interface CitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (lat: number, lon: number, name: string, country: string) => void;
  currentCoords: {lat: number, lon: number, name: string, country: string} | null;
}

export function CitiesModal({ isOpen, onClose, onSelectCity, currentCoords }: CitiesModalProps) {
  const [cities, setCities] = useState<SavedCity[]>([]);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('weather_saved_cities');
      if (saved) setCities(JSON.parse(saved));
    }
  }, [isOpen]);

  const removeCity = (index: number) => {
    const newCities = [...cities];
    newCities.splice(index, 1);
    setCities(newCities);
    localStorage.setItem('weather_saved_cities', JSON.stringify(newCities));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Cities</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {cities.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No saved cities yet. Search and save a city to see it here.</p>
          ) : (
            <ul className="space-y-3">
              {cities.map((city, i) => (
                <li key={`${city.lat}-${city.lon}-${i}`} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <button
                    onClick={() => {
                      onSelectCity(city.lat, city.lon, city.name, city.country);
                      onClose();
                    }}
                    className="flex-1 flex flex-col text-left"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {city.name}
                      {currentCoords?.name === city.name && <MapPin size={14} className="text-blue-500" />}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{city.country}</span>
                  </button>
                  <button
                    onClick={() => removeCity(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
