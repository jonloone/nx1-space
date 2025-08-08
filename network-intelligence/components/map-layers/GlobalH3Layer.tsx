/**
 * Global H3 Hexagon Layer with Complete Earth Coverage
 * 
 * This layer provides comprehensive global coverage of all landmasses using H3 spatial indexing.
 * Features conditional rendering between base mode (subtle gray hexagons) and opportunities mode
 * (colored scoring visualization).
 * 
 * Key Features:
 * - Complete global landmass coverage (all continents, islands, archipelagos)
 * - Conditional visualization modes: base vs opportunities
 * - Memory-optimized rendering for 10,000+ hexagons
 * - Advanced caching and performance optimization
 * - Seamless integration with existing deck.gl layers
 */

import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { LayerProps } from '@deck.gl/core';
import { generateCompleteGlobalCoverage, GlobalHexagon, createGlobalHexVerification } from '@/lib/services/globalHexVerification';
import { useMemo, useEffect, useState, useCallback } from 'react';

/**
 * Global H3 Layer configuration
 */
export interface GlobalH3LayerProps {
  /** Layer visibility */
  visible: boolean;
  /** Display mode: 'base' shows gray hexagons, 'opportunities' shows colored scoring */
  mode: 'base' | 'opportunities';
  /** H3 resolution levels (2-6) */
  resolutions?: number[];
  /** Whether to include ocean hexagons */
  includeOcean?: boolean;
  /** Maximum hexagons per resolution for performance */
  maxHexagons?: number;
  /** Whether to verify complete coverage (slower but ensures no gaps) */
  verifyCompleteness?: boolean;
  /** Callback when hexagon is clicked */
  onHexagonClick?: (hexagon: GlobalHexagon) => void;
  /** Callback when hexagon is hovered */
  onHexagonHover?: (hexagon: GlobalHexagon | null) => void;
  /** Additional layer props */
  layerProps?: Partial<LayerProps>;
}

/**
 * Global coverage state
 */
interface GlobalCoverageState {
  hexagons: Map<number, GlobalHexagon[]>;
  loading: boolean;
  error: string | null;
  stats: {
    totalHexagons: number;
    landHexagons: number;
    oceanHexagons: number;
    coastalHexagons: number;
    verifiedComplete: boolean[];
    gapCounts: number[];
  } | null;
}

/**
 * Cache for global coverage data
 */
const globalCoverageCache = new Map<string, GlobalCoverageState>();

/**
 * Generate cache key for configuration
 */
function generateCacheKey(
  resolutions: number[],
  includeOcean: boolean,
  maxHexagons: number,
  verifyCompleteness: boolean
): string {
  return `${resolutions.join(',')}-${includeOcean}-${maxHexagons}-${verifyCompleteness}`;
}

/**
 * Hook to manage global H3 coverage data
 */
function useGlobalCoverage(
  resolutions: number[],
  includeOcean: boolean,
  maxHexagons: number,
  verifyCompleteness: boolean
): GlobalCoverageState {
  const cacheKey = generateCacheKey(resolutions, includeOcean, maxHexagons, verifyCompleteness);
  
  const [state, setState] = useState<GlobalCoverageState>(() => {
    const cached = globalCoverageCache.get(cacheKey);
    return cached || {
      hexagons: new Map(),
      loading: false,
      error: null,
      stats: null
    };
  });

  useEffect(() => {
    const cached = globalCoverageCache.get(cacheKey);
    if (cached) {
      setState(cached);
      return;
    }

    // Generate new coverage
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const generateCoverage = async () => {
      try {
        console.log('🌍 Generating global H3 coverage...');
        
        const { coverage, stats } = await generateCompleteGlobalCoverage({
          resolutions,
          includeOcean,
          includeAntarctica: false, // Skip Antarctica for commercial purposes
          minLandCoverage: includeOcean ? 0 : 50, // Include more ocean if requested
          verifyCompleteness,
          maxHexagonsPerResolution: Math.floor(maxHexagons / resolutions.length),
          useAdaptiveDetail: true
        });

        const newState: GlobalCoverageState = {
          hexagons: coverage,
          loading: false,
          error: null,
          stats
        };

        setState(newState);
        globalCoverageCache.set(cacheKey, newState);
        
        console.log('✅ Global H3 coverage complete:', {
          totalHexagons: stats.totalHexagons,
          landHexagons: stats.landHexagons,
          resolutions: Array.from(coverage.keys())
        });

      } catch (error) {
        console.error('❌ Failed to generate global coverage:', error);
        const errorState = {
          hexagons: new Map(),
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          stats: null
        };
        setState(errorState);
        globalCoverageCache.set(cacheKey, errorState);
      }
    };

    generateCoverage();
  }, [cacheKey, resolutions, includeOcean, maxHexagons, verifyCompleteness]);

  return state;
}

/**
 * Create the Global H3 Layer
 */
export function createGlobalH3Layer({
  visible,
  mode,
  resolutions = [4, 5],
  includeOcean = false,
  maxHexagons = 12000,
  verifyCompleteness = false,
  onHexagonClick,
  onHexagonHover,
  layerProps = {}
}: GlobalH3LayerProps) {
  if (!visible) {
    return null;
  }

  // Use the hook to get global coverage data
  const { hexagons, loading, error, stats } = useGlobalCoverage(
    resolutions,
    includeOcean,
    maxHexagons,
    verifyCompleteness
  );

  if (loading) {
    console.log('🔄 Global H3 layer loading...');
    return null;
  }

  if (error) {
    console.error('❌ Global H3 layer error:', error);
    return null;
  }

  // Combine all hexagons from all resolutions
  const allHexagons: GlobalHexagon[] = [];
  hexagons.forEach((hexArray) => {
    allHexagons.push(...hexArray);
  });

  if (allHexagons.length === 0) {
    console.warn('⚠️ No hexagons available for Global H3 layer');
    return null;
  }

  console.log(`🗺️ Rendering Global H3 layer: ${allHexagons.length} hexagons in ${mode} mode`);

  // Color function based on mode
  const getFillColor = (hexagon: GlobalHexagon): [number, number, number, number] => {
    if (mode === 'base') {
      return hexagon.baseColor;
    } else {
      // Opportunities mode - use opportunity color if available, otherwise base
      return hexagon.opportunityColor || hexagon.baseColor;
    }
  };

  // Elevation function for 3D effect
  const getElevation = (hexagon: GlobalHexagon): number => {
    if (mode === 'base') {
      return 0; // Flat in base mode
    } else {
      // Elevated based on opportunity score in opportunities mode
      if (hexagon.opportunityScore !== null) {
        return hexagon.opportunityScore * 150; // Max ~15km elevation
      }
      return 0;
    }
  };

  // Line color for borders
  const getLineColor = (hexagon: GlobalHexagon): [number, number, number, number] => {
    if (mode === 'base') {
      return hexagon.isLand ? [255, 255, 255, 60] : [100, 116, 139, 40];
    } else {
      return [255, 255, 255, 100];
    }
  };

  return new H3HexagonLayer({
    id: 'global-h3-coverage',
    data: allHexagons,
    
    // H3 hexagon properties
    getHexagon: (d: GlobalHexagon) => d.hexagon,
    getFillColor,
    getLineColor,
    getLineWidth: 1,
    
    // 3D properties
    getElevation,
    elevationScale: 1,
    extruded: mode === 'opportunities',
    
    // Visual properties
    filled: true,
    stroked: true,
    pickable: true,
    
    // Performance optimizations
    coordinateSystem: 0, // COORDINATE_SYSTEM.LNGLAT
    highlightColor: [255, 255, 255, 150],
    
    // Interaction handlers
    onHover: ({ object, x, y }) => {
      if (onHexagonHover) {
        onHexagonHover(object || null);
      }
    },
    
    onClick: ({ object }) => {
      if (object && onHexagonClick) {
        onHexagonClick(object);
      }
    },

    // Update triggers for efficient re-rendering
    updateTriggers: {
      getFillColor: mode,
      getElevation: mode,
      getLineColor: mode
    },

    // Layer-specific optimizations
    coverage: 0.9, // Slight gap between hexagons for better visualization
    
    // Merge any additional layer props
    ...layerProps
  });
}

/**
 * React component wrapper for Global H3 Layer
 */
export function GlobalH3Layer(props: GlobalH3LayerProps) {
  return createGlobalH3Layer(props);
}

/**
 * Hook to get global coverage statistics
 */
export function useGlobalCoverageStats(
  resolutions: number[] = [4, 5],
  includeOcean: boolean = false,
  maxHexagons: number = 12000,
  verifyCompleteness: boolean = false
) {
  const { stats, loading, error } = useGlobalCoverage(
    resolutions,
    includeOcean,
    maxHexagons,
    verifyCompleteness
  );

  return {
    stats,
    loading,
    error,
    isComplete: stats ? stats.verifiedComplete.every(v => v) : false,
    totalGaps: stats ? stats.gapCounts.reduce((sum, count) => sum + count, 0) : 0
  };
}

/**
 * Utility function to clear the global coverage cache
 */
export function clearGlobalCoverageCache(): void {
  globalCoverageCache.clear();
  console.log('🧹 Global coverage cache cleared');
}

/**
 * Development helper to log coverage information
 */
export function logGlobalCoverageInfo(
  resolutions: number[] = [4, 5],
  includeOcean: boolean = false
): void {
  const verifier = createGlobalHexVerification({
    resolutions,
    includeOcean,
    maxHexagonsPerResolution: 5000,
    verifyCompleteness: true
  });

  verifier.generateGlobalCoverage().then((coverage) => {
    const stats = verifier.getCoverageStats();
    
    console.log('📊 Global H3 Coverage Analysis:');
    console.log(`  Total Hexagons: ${stats.totalHexagons}`);
    console.log(`  Land Hexagons: ${stats.landHexagons}`);
    console.log(`  Ocean Hexagons: ${stats.oceanHexagons}`);
    console.log(`  Coastal Hexagons: ${stats.coastalHexagons}`);
    console.log(`  Resolutions: ${Array.from(coverage.keys()).join(', ')}`);
    console.log(`  Verified Complete: ${stats.verifiedComplete}`);
    console.log(`  Gap Counts: ${stats.gapCounts}`);
    
    coverage.forEach((hexagons, resolution) => {
      console.log(`  Resolution ${resolution}: ${hexagons.length} hexagons`);
      const landHexs = hexagons.filter(h => h.isLand).length;
      const coastalHexs = hexagons.filter(h => h.isCoastal).length;
      console.log(`    Land: ${landHexs}, Coastal: ${coastalHexs}`);
    });
  });
}

export default GlobalH3Layer;