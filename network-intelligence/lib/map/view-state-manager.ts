/**
 * Enhanced Map View State Manager
 * Manages map view states for both 2D and 3D modes with smooth transitions
 */

export type ViewMode = '2d' | '3d';

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface ViewStateManagerOptions {
  defaultView: MapViewState;
  smoothTransitions: boolean;
  transitionDuration: number;
}

export class ViewStateManager {
  private currentView: MapViewState;
  private viewMode: ViewMode = '2d';
  private options: ViewStateManagerOptions;
  private transitionEndCallbacks: (() => void)[] = [];

  constructor(options: Partial<ViewStateManagerOptions> = {}) {
    this.options = {
      defaultView: {
        longitude: 0,
        latitude: 20,
        zoom: 2,
        bearing: 0,
        pitch: 0
      },
      smoothTransitions: true,
      transitionDuration: 1500,
      ...options
    };

    this.currentView = { ...this.options.defaultView };
  }

  /**
   * Get current view state
   */
  getCurrentView(): MapViewState {
    return { ...this.currentView };
  }

  /**
   * Get current view mode
   */
  getCurrentMode(): ViewMode {
    return this.viewMode;
  }

  /**
   * Update view state
   */
  updateView(newView: Partial<MapViewState>): MapViewState {
    this.currentView = {
      ...this.currentView,
      ...newView
    };
    return this.getCurrentView();
  }

  /**
   * Switch between 2D and 3D view modes with smooth transition
   */
  switchViewMode(mode: ViewMode): MapViewState {
    const previousMode = this.viewMode;
    this.viewMode = mode;

    if (mode === '3d' && previousMode === '2d') {
      // Transition to 3D globe view
      this.currentView = {
        ...this.currentView,
        zoom: Math.max(1, this.currentView.zoom - 1), // Zoom out slightly for globe
        pitch: 0, // Reset pitch for globe
        bearing: 0 // Reset bearing for globe
      };
    } else if (mode === '2d' && previousMode === '3d') {
      // Transition to 2D map view  
      this.currentView = {
        ...this.currentView,
        zoom: Math.min(8, this.currentView.zoom + 1), // Zoom in slightly for map
        pitch: 0,
        bearing: 0
      };
    }

    return this.getCurrentView();
  }

  /**
   * Focus on a specific location with smooth transition
   */
  focusOnLocation(
    longitude: number,
    latitude: number,
    zoom?: number,
    options: { bearing?: number; pitch?: number } = {}
  ): MapViewState {
    this.currentView = {
      longitude,
      latitude,
      zoom: zoom || this.currentView.zoom,
      bearing: options.bearing || 0,
      pitch: options.pitch || 0
    };

    return this.getCurrentView();
  }

  /**
   * Focus on a ground station
   */
  focusOnStation(station: { coordinates: [number, number]; name: string }): MapViewState {
    const [lat, lon] = station.coordinates;
    return this.focusOnLocation(lon, lat, 8, { pitch: this.viewMode === '3d' ? 45 : 0 });
  }

  /**
   * Fit bounds to show multiple stations
   */
  fitBounds(
    stations: Array<{ coordinates: [number, number] }>,
    padding: number = 50
  ): MapViewState {
    if (stations.length === 0) return this.getCurrentView();

    if (stations.length === 1) {
      const [lat, lon] = stations[0].coordinates;
      return this.focusOnLocation(lon, lat, 6);
    }

    // Calculate bounding box
    const lats = stations.map(s => s.coordinates[0]);
    const lons = stations.map(s => s.coordinates[1]);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Calculate center and zoom level
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    
    // Estimate zoom level based on bounds
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);
    
    let zoom = 1;
    if (maxDiff < 180) zoom = 2;
    if (maxDiff < 90) zoom = 3;
    if (maxDiff < 45) zoom = 4;
    if (maxDiff < 20) zoom = 5;
    if (maxDiff < 10) zoom = 6;
    if (maxDiff < 5) zoom = 7;

    this.currentView = {
      longitude: centerLon,
      latitude: centerLat,
      zoom,
      bearing: 0,
      pitch: 0
    };

    return this.getCurrentView();
  }

  /**
   * Get optimal view state for displaying ground station network
   */
  getNetworkOverview(): MapViewState {
    // Global view showing all major continents
    this.currentView = {
      longitude: 10,
      latitude: 30,
      zoom: 2.5,
      bearing: 0,
      pitch: this.viewMode === '3d' ? 20 : 0
    };

    return this.getCurrentView();
  }

  /**
   * Get view state for regional focus (e.g., North America, Europe, Asia-Pacific)
   */
  getRegionalView(region: 'north_america' | 'europe' | 'asia_pacific' | 'global'): MapViewState {
    const regionalViews = {
      north_america: {
        longitude: -95,
        latitude: 40,
        zoom: 4,
        bearing: 0,
        pitch: this.viewMode === '3d' ? 30 : 0
      },
      europe: {
        longitude: 10,
        latitude: 52,
        zoom: 4.5,
        bearing: 0,
        pitch: this.viewMode === '3d' ? 30 : 0
      },
      asia_pacific: {
        longitude: 120,
        latitude: 20,
        zoom: 3.5,
        bearing: 0,
        pitch: this.viewMode === '3d' ? 30 : 0
      },
      global: {
        longitude: 0,
        latitude: 20,
        zoom: 2,
        bearing: 0,
        pitch: this.viewMode === '3d' ? 15 : 0
      }
    };

    this.currentView = { ...regionalViews[region] };
    return this.getCurrentView();
  }

  /**
   * Add callback for when transition ends
   */
  onTransitionEnd(callback: () => void): void {
    this.transitionEndCallbacks.push(callback);
  }

  /**
   * Trigger transition end callbacks
   */
  private triggerTransitionEnd(): void {
    this.transitionEndCallbacks.forEach(callback => callback());
    this.transitionEndCallbacks = [];
  }

  /**
   * Get view state with transition properties
   */
  getViewStateWithTransition(): MapViewState & { transitionDuration: number } {
    return {
      ...this.getCurrentView(),
      transitionDuration: this.options.transitionDuration
    };
  }

  /**
   * Reset to default view
   */
  reset(): MapViewState {
    this.viewMode = '2d';
    this.currentView = { ...this.options.defaultView };
    return this.getCurrentView();
  }
}

// Create default instance
export const viewStateManager = new ViewStateManager();

// Utility function to create custom view state manager
export function createViewStateManager(options: Partial<ViewStateManagerOptions>): ViewStateManager {
  return new ViewStateManager(options);
}