import * as Cesium from 'cesium';

/**
 * Optimize Cesium performance with various settings
 */
export const optimizeCesiumPerformance = (viewer: Cesium.Viewer) => {
  const scene = viewer.scene;
  const globe = scene.globe;
  
  // Enable request render mode (only render when needed)
  scene.requestRenderMode = true;
  scene.maximumRenderTimeChange = Infinity;
  
  // Optimize terrain and imagery loading
  globe.tileCacheSize = 1000;
  globe.maximumScreenSpaceError = 1.5;
  globe.preloadSiblings = false;
  globe.preloadAncestors = false;
  
  // Reduce shadow map size for better performance
  viewer.shadowMap.size = 2048;
  viewer.shadowMap.softShadows = false;
  
  // Enable frustum culling
  globe.depthTestAgainstTerrain = true;
  
  // Optimize label rendering
  scene.logarithmicDepthBuffer = true;
  
  // Set reasonable limits
  scene.farToNearRatio = 1000;
  
  // Optimize picking
  scene.pickTranslucentDepth = false;
  scene.useDepthPicking = true;
  
  // Optimize post-processing
  scene.postProcessStages.fxaa.enabled = false;
  scene.postProcessStages.bloom.enabled = false;
  
  // Optimize scene rendering
  scene.debugShowFramesPerSecond = false;
  scene.orderIndependentTranslucency = false;
  
  // Return configuration for reference
  return {
    requestRenderMode: scene.requestRenderMode,
    tileCacheSize: globe.tileCacheSize,
    maximumScreenSpaceError: globe.maximumScreenSpaceError,
    shadowMapSize: viewer.shadowMap.size,
    farToNearRatio: scene.farToNearRatio
  };
};

/**
 * Performance monitor for Cesium
 */
export class CesiumPerformanceMonitor {
  private viewer: Cesium.Viewer;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;
  private renderTime: number = 0;
  private updateCallbacks: ((stats: PerformanceStats) => void)[] = [];
  
  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.startMonitoring();
  }
  
  private startMonitoring() {
    // Monitor frame rendering
    this.viewer.scene.postRender.addEventListener(() => {
      this.frameCount++;
      const currentTime = performance.now();
      
      // Calculate FPS every second
      if (currentTime - this.lastTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        // Get render statistics
        const stats = this.getStats();
        
        // Notify callbacks
        this.updateCallbacks.forEach(callback => callback(stats));
      }
    });
  }
  
  getStats(): PerformanceStats {
    const scene = this.viewer.scene;
    const globe = scene.globe;
    
    return {
      fps: this.fps,
      tilesLoaded: globe._surface?._tilesToRender?.length || 0,
      tilesTotal: globe._surface?._tileLoadQueueHigh?.length || 0,
      terrainTiles: globe._surface?._debug?.tilesRendered || 0,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      renderTime: this.renderTime,
      requestRenderMode: scene.requestRenderMode,
      maximumScreenSpaceError: globe.maximumScreenSpaceError
    };
  }
  
  onUpdate(callback: (stats: PerformanceStats) => void) {
    this.updateCallbacks.push(callback);
  }
  
  /**
   * Auto-adjust quality based on performance
   */
  enableAutoQuality(targetFPS: number = 30) {
    this.onUpdate((stats) => {
      const scene = this.viewer.scene;
      const globe = scene.globe;
      
      if (stats.fps < targetFPS - 5) {
        // Reduce quality if FPS is too low
        globe.maximumScreenSpaceError = Math.min(4, globe.maximumScreenSpaceError + 0.5);
        globe.tileCacheSize = Math.max(100, globe.tileCacheSize - 100);
        
        // Disable expensive features
        if (stats.fps < targetFPS - 10) {
          scene.fog.enabled = false;
          scene.globe.showGroundAtmosphere = false;
        }
      } else if (stats.fps > targetFPS + 10) {
        // Increase quality if FPS is high
        globe.maximumScreenSpaceError = Math.max(1, globe.maximumScreenSpaceError - 0.2);
        globe.tileCacheSize = Math.min(2000, globe.tileCacheSize + 100);
        
        // Re-enable features
        scene.fog.enabled = true;
        scene.globe.showGroundAtmosphere = true;
      }
    });
  }
  
  destroy() {
    this.updateCallbacks = [];
  }
}

/**
 * Data culling for optimal performance
 */
export class CesiumDataCuller {
  private viewer: Cesium.Viewer;
  private maxEntities: number;
  private cullDistance: number;
  
  constructor(viewer: Cesium.Viewer, maxEntities: number = 1000, cullDistance: number = 5000000) {
    this.viewer = viewer;
    this.maxEntities = maxEntities;
    this.cullDistance = cullDistance;
    
    this.setupCulling();
  }
  
  private setupCulling() {
    // Monitor camera changes
    this.viewer.camera.changed.addEventListener(() => {
      this.cullEntities();
    });
  }
  
  private cullEntities() {
    const camera = this.viewer.camera;
    const cameraPosition = camera.positionWC;
    const entities = this.viewer.entities.values;
    
    // Sort entities by distance from camera
    const sortedEntities = entities.slice().sort((a, b) => {
      const aPos = a.position?.getValue(this.viewer.clock.currentTime);
      const bPos = b.position?.getValue(this.viewer.clock.currentTime);
      
      if (!aPos || !bPos) return 0;
      
      const aDist = Cesium.Cartesian3.distance(cameraPosition, aPos);
      const bDist = Cesium.Cartesian3.distance(cameraPosition, bPos);
      
      return aDist - bDist;
    });
    
    // Show/hide entities based on distance and count
    sortedEntities.forEach((entity, index) => {
      const position = entity.position?.getValue(this.viewer.clock.currentTime);
      
      if (!position) {
        entity.show = false;
        return;
      }
      
      const distance = Cesium.Cartesian3.distance(cameraPosition, position);
      
      // Hide if too far or exceeds max count
      if (distance > this.cullDistance || index >= this.maxEntities) {
        entity.show = false;
      } else {
        entity.show = true;
      }
    });
  }
  
  /**
   * Set maximum number of visible entities
   */
  setMaxEntities(max: number) {
    this.maxEntities = max;
    this.cullEntities();
  }
  
  /**
   * Set culling distance
   */
  setCullDistance(distance: number) {
    this.cullDistance = distance;
    this.cullEntities();
  }
}

interface PerformanceStats {
  fps: number;
  tilesLoaded: number;
  tilesTotal: number;
  terrainTiles: number;
  memoryUsage: number;
  renderTime: number;
  requestRenderMode: boolean;
  maximumScreenSpaceError: number;
}