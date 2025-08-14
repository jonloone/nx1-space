import * as Cesium from 'cesium';

/**
 * Synchronizer for Cesium and Deck.gl integration
 */
export class CesiumDeckSynchronizer {
  private viewer: Cesium.Viewer;
  private deckOverlay: any;
  private syncEnabled: boolean = true;

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  /**
   * Set Deck.gl overlay reference
   */
  setDeckOverlay(overlay: any) {
    this.deckOverlay = overlay;
  }

  /**
   * Convert Cesium Cartesian3 to Deck.gl coordinates [lng, lat, height]
   */
  cartesianToLngLat(cartesian: Cesium.Cartesian3): [number, number, number] {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    return [
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude),
      cartographic.height
    ];
  }

  /**
   * Convert Deck.gl coordinates to Cesium Cartesian3
   */
  lngLatToCartesian(lng: number, lat: number, height: number = 0): Cesium.Cartesian3 {
    return Cesium.Cartesian3.fromDegrees(lng, lat, height);
  }

  /**
   * Convert Cesium camera to Deck.gl view state
   */
  getCesiumViewState() {
    const camera = this.viewer.camera;
    const cartographic = camera.positionCartographic;
    
    // Get camera position
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;
    
    // Convert height to zoom level (approximate)
    // Deck.gl zoom 0 = ~40,000km altitude, zoom 24 = ~10m altitude
    const zoom = Math.max(0, Math.min(24, 
      Math.log2(40000000 / height)
    ));
    
    // Get camera orientation
    // Cesium pitch: -90° (looking down) to 90° (looking up)
    // Deck.gl pitch: 0° (looking down) to 90° (looking forward)
    const pitch = Math.max(0, Math.min(90, Cesium.Math.toDegrees(camera.pitch) + 90));
    
    // Get bearing (heading)
    const bearing = Cesium.Math.toDegrees(camera.heading);
    
    return {
      longitude,
      latitude,
      zoom,
      pitch,
      bearing,
      altitude: height
    };
  }

  /**
   * Apply Deck.gl view state to Cesium camera
   */
  applyDeckViewState(viewState: any) {
    if (!this.syncEnabled) return;
    
    const { longitude, latitude, zoom, pitch, bearing } = viewState;
    
    // Convert zoom to altitude
    const altitude = 40000000 / Math.pow(2, zoom);
    
    // Convert Deck.gl pitch to Cesium pitch
    const cesiumPitch = Cesium.Math.toRadians(pitch - 90);
    
    // Set camera view
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
      orientation: {
        heading: Cesium.Math.toRadians(bearing || 0),
        pitch: cesiumPitch,
        roll: 0
      }
    });
  }

  /**
   * Get visible bounds for culling
   */
  getVisibleBounds() {
    const canvas = this.viewer.scene.canvas;
    const ellipsoid = this.viewer.scene.globe.ellipsoid;
    
    // Get viewport corners
    const corners = [
      new Cesium.Cartesian2(0, 0),
      new Cesium.Cartesian2(canvas.width, 0),
      new Cesium.Cartesian2(canvas.width, canvas.height),
      new Cesium.Cartesian2(0, canvas.height)
    ];
    
    // Convert to geographic coordinates
    const bounds = corners.map(corner => {
      const cartesian = this.viewer.camera.pickEllipsoid(corner, ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        return {
          longitude: Cesium.Math.toDegrees(cartographic.longitude),
          latitude: Cesium.Math.toDegrees(cartographic.latitude)
        };
      }
      return null;
    }).filter(Boolean);
    
    if (bounds.length < 2) return null;
    
    // Calculate bounding box
    const lngs = bounds.map(b => b!.longitude);
    const lats = bounds.map(b => b!.latitude);
    
    return {
      west: Math.min(...lngs),
      east: Math.max(...lngs),
      south: Math.min(...lats),
      north: Math.max(...lats)
    };
  }

  /**
   * Sync Deck.gl layer visibility with Cesium entities
   */
  syncLayerVisibility(layerId: string, visible: boolean) {
    // Update Cesium entities
    this.viewer.entities.values.forEach(entity => {
      if (entity.properties && entity.properties.layerId) {
        const entityLayerId = entity.properties.layerId.getValue();
        if (entityLayerId === layerId) {
          entity.show = visible;
        }
      }
    });
    
    // Update Deck.gl layers if overlay exists
    if (this.deckOverlay) {
      this.deckOverlay.setLayerVisibility(layerId, visible);
    }
  }

  /**
   * Convert screen coordinates to geographic position
   */
  screenToGeo(x: number, y: number): { longitude: number; latitude: number; height: number } | null {
    const cartesian = this.viewer.camera.pickEllipsoid(
      new Cesium.Cartesian2(x, y),
      this.viewer.scene.globe.ellipsoid
    );
    
    if (!cartesian) return null;
    
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    
    return {
      longitude: Cesium.Math.toDegrees(cartographic.longitude),
      latitude: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height
    };
  }

  /**
   * Convert geographic position to screen coordinates
   */
  geoToScreen(longitude: number, latitude: number, height: number = 0): { x: number; y: number } | null {
    const cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    const screenPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      this.viewer.scene,
      cartesian
    );
    
    if (!screenPos) return null;
    
    return {
      x: screenPos.x,
      y: screenPos.y
    };
  }

  /**
   * Calculate pixel scale at a given latitude
   * Useful for sizing Deck.gl elements
   */
  getPixelScale(latitude: number): number {
    const camera = this.viewer.camera;
    const height = camera.positionCartographic.height;
    
    // Approximate pixel scale based on altitude and latitude
    const earthRadius = 6371000; // meters
    const latRad = Cesium.Math.toRadians(latitude);
    const metersPerDegree = (Math.PI * earthRadius * Math.cos(latRad)) / 180;
    const metersPerPixel = height / this.viewer.scene.canvas.height;
    
    return metersPerPixel / metersPerDegree;
  }

  /**
   * Enable/disable synchronization
   */
  setSyncEnabled(enabled: boolean) {
    this.syncEnabled = enabled;
  }

  /**
   * Check if a position is visible in current view
   */
  isPositionVisible(longitude: number, latitude: number): boolean {
    const bounds = this.getVisibleBounds();
    if (!bounds) return false;
    
    return longitude >= bounds.west && 
           longitude <= bounds.east && 
           latitude >= bounds.south && 
           latitude <= bounds.north;
  }

  /**
   * Get camera distance to a position
   */
  getDistanceToPosition(longitude: number, latitude: number, height: number = 0): number {
    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    return Cesium.Cartesian3.distance(this.viewer.camera.positionWC, position);
  }
}