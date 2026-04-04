import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { searchLocations, LocationSearchResult } from '../services/weather';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SearchBarProps {
  onLocationSelect: (lat: number, lon: number, name: string, country: string) => void;
  onCurrentLocation: () => void;
  isLocating: boolean;
}

export function SearchBar({ onLocationSelect, onCurrentLocation, isLocating }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      const data = await searchLocations(query);
      setResults(data);
      setIsSearching(false);
      setShowDropdown(true);
    };

    const debounce = setTimeout(search, 500);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="relative w-full max-w-md mx-auto z-50" ref={dropdownRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Search city..."
          className="w-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-full py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-lg"
        />
        <button
          onClick={onCurrentLocation}
          disabled={isLocating}
          className="absolute right-2 p-2 text-blue-500 dark:text-blue-400 hover:bg-white/20 dark:hover:bg-black/20 rounded-full transition-colors"
          title="Use current location"
        >
          {isLocating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <ul className="max-h-60 overflow-y-auto py-2">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    onClick={() => {
                      onLocationSelect(result.latitude, result.longitude, result.name, result.country);
                      setQuery('');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col transition-colors"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">{result.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
