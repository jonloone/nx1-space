'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Building, Compass, Navigation, Loader2, Building2, Map as MapIcon } from 'lucide-react';
import { getGERSService } from '@/lib/services/GERSService';
import { getGERSDataLoader } from '@/lib/services/GERSDataLoader';
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
  const gersDataLoader = React.useRef(getGERSDataLoader());
  const { selectFeature } = useMapStore();

  // Common places database
  const commonPlaces = React.useMemo(() => [
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

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      onResultsChange([]);
      return;
    }

    const performSearch = async () => {
      onLoadingChange(true);
      try {
        const searchResults: SearchResult[] = [];
        const queryLower = query.toLowerCase();

        // 1. Search common places (cities, states)
        const placeResults = commonPlaces.filter(place => 
          place.name.toLowerCase().includes(queryLower) ||
          place.type.toLowerCase().includes(queryLower) ||
          (place.abbreviation && place.abbreviation.toLowerCase() === queryLower) ||
          (place.state && place.state.toLowerCase().includes(queryLower)) ||
          (place.country && place.country.toLowerCase().includes(queryLower))
        );

        placeResults.forEach(place => {
          searchResults.push({
            id: place.id,
            name: place.name,
            type: place.type === 'city' ? 'location' : place.type === 'state' ? 'feature' : 'location',
            coordinates: place.coordinates,
            description: place.type === 'city' ? 'City' : place.type === 'state' ? 'State' : 'Location',
            metadata: {
              placeType: place.type,
              state: place.state,
              country: place.country,
              abbreviation: place.abbreviation
            }
          });
        });

        // 2. Search using GERS for places and features
        try {
          const gersResults = await gersService.current.searchEntities(query, {
            limit: 10,
            includeAlternateNames: true,
          });

          // Convert GERS results to SearchResult format
          gersResults.forEach(entity => {
            searchResults.push({
              id: entity.id,
              name: entity.names[0] || 'Unknown',
              type: mapEntityTypeToSearchType(entity.category),
              gersId: entity.id,
              coordinates: entity.location ? [entity.location.lng, entity.location.lat] : undefined,
              description: `${entity.category}${entity.subtype ? '/' + entity.subtype : ''}`,
              metadata: {
                alternateNames: entity.names.slice(1),
                height: entity.height,
                category: entity.category,
                subtype: entity.subtype,
              },
            });
          });
        } catch (error) {
          console.error('GERS search error:', error);
        }

        // 3. Search buildings from GERSDataLoader
        if (queryLower.includes('building') || queryLower.includes('tower') || queryLower.includes('office')) {
          try {
            await gersDataLoader.current.initialize();
            
            // Search near major cities
            const cityCoords = [
              [25.7617, -80.1918], // Miami
              [29.7604, -95.3698], // Houston
              [34.0522, -118.2437], // LA
              [40.7128, -74.0060]  // NYC
            ];

            for (const [lat, lng] of cityCoords) {
              const buildings = await gersDataLoader.current.queryBuildingsInRadius(
                [lat, lng], 
                5, // 5km radius
                { minConfidence: 0.5 }
              );

              // Add top buildings to results
              buildings.slice(0, 3).forEach(building => {
                const center = building.geometry.type === 'Polygon' ? 
                  getCenterOfPolygon(building.geometry.coordinates[0]) : null;
                
                if (center) {
                  searchResults.push({
                    id: building.id,
                    name: building.properties.names?.primary || `Building ${building.id.slice(-6)}`,
                    type: 'station', // Using station type for buildings
                    coordinates: center,
                    description: `${building.properties.class || 'Building'} • ${building.properties.height || 0}m`,
                    metadata: {
                      buildingType: building.properties.class,
                      height: building.properties.height,
                      floors: building.properties.numFloors,
                      gersBuilding: true
                    }
                  });
                }
              });
            }
          } catch (error) {
            console.error('Building search error:', error);
          }
        }

        // 4. Search for ground stations
        if (queryLower.includes('station') || queryLower.includes('ground')) {
          const stationResults: SearchResult[] = [
            {
              id: 'station-miami',
              name: 'Miami Ground Station',
              type: 'station',
              coordinates: [-80.1918, 25.7617],
              description: 'Satellite ground station',
            },
            {
              id: 'station-houston',
              name: 'Houston Ground Station',
              type: 'station',
              coordinates: [-95.3698, 29.7604],
              description: 'Satellite ground station',
            },
          ].filter(station => 
            station.name.toLowerCase().includes(queryLower)
          );

          searchResults.push(...stationResults);
        }

        // Remove duplicates and limit results
        const uniqueResults = Array.from(
          new Map(searchResults.map(item => [item.id, item])).values()
        ).slice(0, 15);

        onResultsChange(uniqueResults);
      } catch (error) {
        console.error('Search error:', error);
        onResultsChange([]);
      } finally {
        onLoadingChange(false);
      }
    };

    // Helper function to get center of polygon
    const getCenterOfPolygon = (coords: number[][]) => {
      const centerLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
      const centerLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
      return [centerLng, centerLat];
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

  const getIcon = (result: SearchResult) => {
    // Check metadata for more specific icons
    if (result.metadata?.placeType === 'city') {
      return <Building2 className="w-4 h-4" />;
    }
    if (result.metadata?.placeType === 'state' || result.metadata?.placeType === 'country') {
      return <MapIcon className="w-4 h-4" />;
    }
    if (result.metadata?.gersBuilding || result.metadata?.buildingType) {
      return <Building className="w-4 h-4" />;
    }
    
    // Default by type
    switch (result.type) {
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