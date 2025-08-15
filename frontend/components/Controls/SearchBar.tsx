'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Building2, Anchor } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';
import Fuse from 'fuse.js';

export function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [fuse, setFuse] = useState<Fuse<any> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { flyTo, dataCache, domain } = useMapStore();
  
  // Initialize Fuse.js with data from store
  useEffect(() => {
    const allData = [];
    
    // Collect all searchable data from cache
    dataCache.forEach((data, key) => {
      if (data) {
        if (data.stations) {
          data.stations.forEach((item: any) => {
            allData.push({
              ...item,
              type: 'station',
              icon: Building2,
              lat: item.latitude,
              lon: item.longitude
            });
          });
        }
        if (data.vessels) {
          data.vessels.forEach((item: any) => {
            allData.push({
              ...item,
              type: 'vessel',
              icon: Anchor,
              lat: item.latitude,
              lon: item.longitude
            });
          });
        }
        if (data.ports) {
          data.ports.forEach((item: any) => {
            allData.push({
              ...item,
              type: 'port',
              icon: Anchor,
              lat: item.latitude,
              lon: item.longitude
            });
          });
        }
      }
    });
    
    // Add some default locations
    const defaultLocations = [
      { id: 'loc1', name: 'New York', type: 'city', lat: 40.7128, lon: -74.0060, icon: MapPin },
      { id: 'loc2', name: 'London', type: 'city', lat: 51.5074, lon: -0.1278, icon: MapPin },
      { id: 'loc3', name: 'Tokyo', type: 'city', lat: 35.6762, lon: 139.6503, icon: MapPin },
      { id: 'loc4', name: 'Singapore', type: 'city', lat: 1.3521, lon: 103.8198, icon: MapPin },
      { id: 'loc5', name: 'Sydney', type: 'city', lat: -33.8688, lon: 151.2093, icon: MapPin },
    ];
    
    const searchData = [...allData, ...defaultLocations];
    
    // Configure Fuse.js
    const fuseInstance = new Fuse(searchData, {
      keys: ['name', 'id', 'type', 'vessel_name', 'vessel_type', 'operator', 'city', 'country', 'region'],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
      shouldSort: true
    });
    
    setFuse(fuseInstance);
  }, [dataCache]);
  
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery || !fuse) {
      setResults([]);
      return;
    }
    
    // Perform fuzzy search
    const searchResults = fuse.search(searchQuery);
    
    // Format results
    const formattedResults = searchResults.slice(0, 10).map(result => ({
      ...result.item,
      score: result.score
    }));
    
    setResults(formattedResults);
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
                  key={result.id || Math.random()}
                  onClick={() => selectLocation(result)}
                  className="w-full px-3 py-2 flex items-center gap-2
                           hover:bg-white/10 transition-colors text-left"
                >
                  {result.icon ? (
                    <result.icon className="w-4 h-4 text-white/50 flex-shrink-0" />
                  ) : (
                    <MapPin className="w-4 h-4 text-white/50 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {result.name || result.vessel_name || result.id}
                    </div>
                    <div className="text-xs text-white/40">
                      {result.type} {result.score && `• ${Math.round((1 - result.score) * 100)}% match`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}