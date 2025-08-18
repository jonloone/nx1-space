'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Building, Compass, Navigation, Loader2 } from 'lucide-react';
import { getGERSService } from '@/lib/services/GERSService';
import { useMapStore } from '@/lib/store/mapStore';
import type { SearchResult } from './SearchChatBar';

interface SearchModeProps {
  query: string;
  results: SearchResult[];
  onResultsChange: (results: SearchResult[]) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export const SearchMode: React.FC<SearchModeProps> = ({
  query,
  results,
  onResultsChange,
  isLoading,
  onLoadingChange,
}) => {
  const gersService = React.useRef(getGERSService());
  const { selectFeature } = useMapStore();

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      onResultsChange([]);
      return;
    }

    const performSearch = async () => {
      onLoadingChange(true);
      try {
        // Search using GERS
        const gersResults = await gersService.current.searchEntities(query, {
          limit: 10,
          includeAlternateNames: true,
        });

        // Convert GERS results to SearchResult format
        const searchResults: SearchResult[] = gersResults.map(entity => ({
          id: entity.id,
          name: entity.names[0] || 'Unknown',
          type: mapEntityTypeToSearchType(entity.category),
          gersId: entity.id,
          coordinates: entity.location ? [entity.location.lng, entity.location.lat] : undefined,
          description: `${entity.category}/${entity.subtype}`,
          metadata: {
            alternateNames: entity.names.slice(1),
            height: entity.height,
            category: entity.category,
            subtype: entity.subtype,
          },
        }));

        // Also search for ground stations if query mentions "station"
        if (query.toLowerCase().includes('station')) {
          // Add mock ground station results
          const stationResults: SearchResult[] = [
            {
              id: 'station-1',
              name: 'Los Angeles Ground Station',
              type: 'station',
              coordinates: [-118.2437, 34.0522],
              description: 'Primary ground station',
            },
            {
              id: 'station-2',
              name: 'San Francisco Ground Station',
              type: 'station',
              coordinates: [-122.4194, 37.7749],
              description: 'Secondary ground station',
            },
          ].filter(station => 
            station.name.toLowerCase().includes(query.toLowerCase())
          );

          searchResults.push(...stationResults);
        }

        onResultsChange(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        onResultsChange([]);
      } finally {
        onLoadingChange(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, onResultsChange, onLoadingChange]);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.coordinates) {
      // Navigate to the location
      const mapView = document.querySelector('.deckgl-wrapper');
      if (mapView) {
        // Trigger map navigation through the store
        const event = new CustomEvent('navigate-to-location', {
          detail: {
            longitude: result.coordinates[0],
            latitude: result.coordinates[1],
            zoom: result.type === 'station' ? 14 : 12,
          },
        });
        window.dispatchEvent(event);
      }

      // Select the feature
      selectFeature({
        id: result.id,
        name: result.name,
        type: result.type,
        coordinates: result.coordinates,
        gersId: result.gersId,
        ...result.metadata,
      });
    }
  }, [selectFeature]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'station':
        return <Building className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      case 'feature':
        return <Compass className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="search-results-container">
      {isLoading ? (
        <div className="search-loading">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Searching...</span>
        </div>
      ) : results.length > 0 ? (
        <div className="search-results-list">
          <AnimatePresence>
            {results.map((result, index) => (
              <motion.button
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleResultClick(result)}
                className="search-result-item"
              >
                <div className="search-result-icon">
                  {getIcon(result.type)}
                </div>
                <div className="search-result-content">
                  <div className="search-result-name">{result.name}</div>
                  <div className="search-result-description">
                    {result.description}
                    {result.metadata?.alternateNames?.length > 0 && (
                      <span className="search-result-alt-names">
                        {' · '}
                        {result.metadata.alternateNames[0]}
                      </span>
                    )}
                  </div>
                </div>
                {result.coordinates && (
                  <Navigation className="w-4 h-4 search-result-navigate" />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      ) : query.trim() ? (
        <div className="search-no-results">
          <span>No results found for "{query}"</span>
        </div>
      ) : null}
    </div>
  );
};

// Helper function to map GERS entity types to search result types
function mapEntityTypeToSearchType(category: string): SearchResult['type'] {
  switch (category.toLowerCase()) {
    case 'building':
    case 'facility':
      return 'station';
    case 'place':
    case 'region':
      return 'location';
    default:
      return 'feature';
  }
}