'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';

export function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { flyTo } = useMapStore();
  
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) {
      setResults([]);
      return;
    }
    
    // Mock search results - would integrate with geocoding API
    const mockResults = [
      { id: 1, name: 'New York Ground Station', lat: 40.7128, lon: -74.0060 },
      { id: 2, name: 'London Facility', lat: 51.5074, lon: -0.1278 },
      { id: 3, name: 'Tokyo Operations', lat: 35.6762, lon: 139.6503 },
    ].filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    setResults(mockResults);
  };
  
  const selectLocation = (result: any) => {
    flyTo(result.lon, result.lat, 10);
    setIsExpanded(false);
    setQuery('');
    setResults([]);
  };
  
  return (
    <AnimatePresence mode="wait">
      {!isExpanded ? (
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="px-4 py-2 glass rounded-lg flex items-center gap-2
                     hover:bg-white/10 transition-all min-w-[200px]"
        >
          <Search className="w-4 h-4 text-white/70" />
          <span className="text-sm text-white/50">Search locations...</span>
        </motion.button>
      ) : (
        <motion.div
          initial={{ width: 200, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 200, opacity: 0 }}
          className="glass rounded-lg overflow-hidden"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
            <Search className="w-4 h-4 text-white/50" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsExpanded(false);
                } else if (e.key === 'Enter' && results.length > 0) {
                  selectLocation(results[0]);
                }
              }}
              placeholder="Search location..."
              className="flex-1 bg-transparent text-white text-sm 
                       placeholder-white/30 outline-none"
            />
            <button
              onClick={() => {
                setIsExpanded(false);
                setQuery('');
                setResults([]);
              }}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-3 h-3 text-white/50" />
            </button>
          </div>
          
          {results.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => selectLocation(result)}
                  className="w-full px-3 py-2 flex items-center gap-2
                           hover:bg-white/10 transition-colors text-left"
                >
                  <MapPin className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <span className="text-sm text-white truncate">
                    {result.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}