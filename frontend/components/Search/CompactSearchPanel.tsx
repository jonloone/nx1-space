'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, Satellite, Building2 } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';

interface CompactSearchPanelProps {
  onClose?: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'location' | 'station' | 'feature';
  coordinates?: [number, number];
  description?: string;
}

export function CompactSearchPanel({ onClose }: CompactSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { flyTo, selectFeature } = useMapStore();

  // Common places database (same as SearchMode)
  const commonPlaces = useMemo(() => [
    // Major US Cities
    { id: 'city-miami', name: 'Miami, Florida', type: 'city', coordinates: [-80.1918, 25.7617], state: 'FL' },
    { id: 'city-houston', name: 'Houston, Texas', type: 'city', coordinates: [-95.3698, 29.7604], state: 'TX' },
    { id: 'city-la', name: 'Los Angeles, California', type: 'city', coordinates: [-118.2437, 34.0522], state: 'CA' },
    { id: 'city-nyc', name: 'New York City, New York', type: 'city', coordinates: [-74.0060, 40.7128], state: 'NY' },
    { id: 'city-chicago', name: 'Chicago, Illinois', type: 'city', coordinates: [-87.6298, 41.8781], state: 'IL' },
    { id: 'city-sf', name: 'San Francisco, California', type: 'city', coordinates: [-122.4194, 37.7749], state: 'CA' },
    { id: 'city-seattle', name: 'Seattle, Washington', type: 'city', coordinates: [-122.3321, 47.6062], state: 'WA' },
    { id: 'city-boston', name: 'Boston, Massachusetts', type: 'city', coordinates: [-71.0589, 42.3601], state: 'MA' },
    
    // US States
    { id: 'state-fl', name: 'Florida', type: 'state', coordinates: [-81.5158, 27.6648], abbreviation: 'FL' },
    { id: 'state-tx', name: 'Texas', type: 'state', coordinates: [-99.9018, 31.9686], abbreviation: 'TX' },
    { id: 'state-ca', name: 'California', type: 'state', coordinates: [-119.4179, 36.7783], abbreviation: 'CA' },
    { id: 'state-ny', name: 'New York', type: 'state', coordinates: [-74.2179, 43.0000], abbreviation: 'NY' },
    
    // International Cities
    { id: 'city-london', name: 'London, United Kingdom', type: 'city', coordinates: [-0.1278, 51.5074], country: 'UK' },
    { id: 'city-tokyo', name: 'Tokyo, Japan', type: 'city', coordinates: [139.6503, 35.6762], country: 'JP' },
    { id: 'city-singapore', name: 'Singapore', type: 'city', coordinates: [103.8198, 1.3521], country: 'SG' },
    { id: 'city-sydney', name: 'Sydney, Australia', type: 'city', coordinates: [151.2093, -33.8688], country: 'AU' },
  ], []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const queryLower = searchQuery.toLowerCase();
    
    // Search through common places
    const placeResults = commonPlaces.filter(place => 
      place.name.toLowerCase().includes(queryLower) ||
      place.type.toLowerCase().includes(queryLower) ||
      (place.abbreviation && place.abbreviation.toLowerCase() === queryLower) ||
      (place.state && place.state.toLowerCase().includes(queryLower)) ||
      (place.country && place.country.toLowerCase().includes(queryLower))
    );

    // Convert to SearchResult format
    const searchResults: SearchResult[] = placeResults.map(place => ({
      id: place.id,
      name: place.name,
      type: place.type === 'city' || place.type === 'state' ? 'location' : place.type as any,
      coordinates: place.coordinates as [number, number],
      description: place.type === 'city' ? 'City' : place.type === 'state' ? 'State' : 'Location'
    }));

    // Add some ground stations if searching for stations
    if (queryLower.includes('station') || queryLower.includes('ground')) {
      searchResults.push(
        {
          id: 'station-dc',
          name: 'Washington DC Ground Station',
          type: 'station',
          coordinates: [-77.0369, 38.9072],
          description: 'East Coast hub'
        },
        {
          id: 'station-la',
          name: 'Los Angeles Ground Station',
          type: 'station',
          coordinates: [-118.2437, 34.0522],
          description: 'West Coast ops'
        }
      );
    }
    
    setTimeout(() => {
      setResults(searchResults.slice(0, 10)); // Limit to 10 results
      setIsSearching(false);
    }, 100);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.coordinates) {
      // Different zoom levels for different types
      const zoomLevel = result.type === 'station' ? 14 : 
                       result.description === 'State' ? 7 : 12;
      
      flyTo(result.coordinates[0], result.coordinates[1], zoomLevel);
      
      // Only select features for stations (not cities/states)
      if (result.type === 'station') {
        selectFeature({
          id: result.id,
          name: result.name,
          type: 'station'
        });
      }
    }
    onClose?.();
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'station': return Satellite;
      case 'location': return MapPin;
      default: return Building2;
    }
  };

  return (
    <div className="compact-panel bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="panel-header px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-medium text-white">Search</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Search Input */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search locations..."
            className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-white/10 rounded-md
                     text-sm text-white placeholder-gray-500
                     focus:bg-gray-800/70 focus:border-blue-500/50 focus:outline-none
                     transition-all"
          />
        </div>
      </div>

      {/* Results */}
      <div className="max-h-[250px] overflow-y-auto">
        {isSearching ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            Searching...
          </div>
        ) : results.length > 0 ? (
          <div className="p-1">
            {results.map((result) => {
              const Icon = getIcon(result.type);
              return (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-md
                           hover:bg-white/5 transition-colors text-left"
                >
                  <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      {result.name}
                    </div>
                    {result.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {result.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : query ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            No results found
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 text-xs">
            Start typing to search
          </div>
        )}
      </div>
    </div>
  );
}