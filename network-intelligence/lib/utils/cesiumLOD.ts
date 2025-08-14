import * as Cesium from 'cesium';

/**
 * Level of Detail (LOD) Manager for Cesium
 * Optimizes rendering based on camera altitude
 */
export class CesiumLODManager {
  private viewer: Cesium.Viewer;
  private currentAltitude: number = 0;
  private altitudeThresholds = {
    space: 5000000,     // > 5M km
    regional: 500000,   // 500km - 5M km
    local: 50000,       // 50km - 500km
    detailed: 5000      // < 50km
  };
  
  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
    this.setupLODSystem();
  }
  
  private setupLODSystem() {
    // Monitor camera altitude changes
    this.viewer.camera.changed.addEventListener(() => {
      const altitude = this.viewer.camera.positionCartographic.height;
      
      // Only update if altitude changed significantly (100km threshold)
      if (Math.abs(altitude - this.currentAltitude) > 100000) {
        this.currentAltitude = altitude;
        this.updateLOD(altitude);
      }
    });
    
    // Initial LOD setup
    const initialAltitude = this.viewer.camera.positionCartographic.height;
    this.updateLOD(initialAltitude);
  }
  
  private updateLOD(altitude: number) {
    const scene = this.viewer.scene;
    const globe = scene.globe;
    
    // Space view (> 5M km) - Lowest detail
    if (altitude > this.altitudeThresholds.space) {
      globe.maximumScreenSpaceError = 3;
      scene.fog.density = 0.00001;
      scene.globe.tileCacheSize = 500;
      
      // Reduce shadow quality
      this.viewer.shadowMap.size = 1024;
      
      // Hide detailed labels and small features
      this.setEntityVisibility('minor', false);
      this.setEntityVisibility('labels', false);
      
    // Regional view (500km - 5M km) - Medium detail
    } else if (altitude > this.altitudeThresholds.regional) {
      globe.maximumScreenSpaceError = 2;
      scene.fog.density = 0.0001;
      scene.globe.tileCacheSize = 750;
      
      // Medium shadow quality
      this.viewer.shadowMap.size = 2048;
      
      // Show major labels only
      this.setEntityVisibility('minor', false);
      this.setEntityVisibility('labels', true, 'major');
      
    // Local view (50km - 500km) - High detail
    } else if (altitude > this.altitudeThresholds.local) {
      globe.maximumScreenSpaceError = 1.5;
      scene.fog.density = 0.0002;
      scene.globe.tileCacheSize = 1000;
      
      // High shadow quality
      this.viewer.shadowMap.size = 2048;
      
      // Show most features
      this.setEntityVisibility('minor', true);
      this.setEntityVisibility('labels', true, 'all');
      
    // Detailed view (< 50km) - Maximum detail
    } else {
      globe.maximumScreenSpaceError = 1;
      scene.fog.density = 0.0003;
      scene.globe.tileCacheSize = 1500;
      
      // Maximum shadow quality
      this.viewer.shadowMap.size = 4096;
      
      // Show all features
      this.setEntityVisibility('minor', true);
      this.setEntityVisibility('labels', true, 'all');
    }
    
    // Trigger scene update
    scene.requestRender();
  }
  
  private setEntityVisibility(category: string, visible: boolean, level: string = 'all') {
    // Iterate through entities and update visibility based on category
    this.viewer.entities.values.forEach(entity => {
      // Check entity properties for category
      if (entity.properties && entity.properties.category) {
        const entityCategory = entity.properties.category.getValue();
        
        if (entityCategory === category) {
          // For labels, check importance level
          if (category === 'labels' && level === 'major') {
            const importance = entity.properties.importance?.getValue() || 'minor';
            entity.show = visible && importance === 'major';
          } else {
            entity.show = visible;
          }
        }
      }
    });
  }
  
  /**
   * Get current LOD level
   */
  getCurrentLevel(): 'space' | 'regional' | 'local' | 'detailed' {
    if (this.currentAltitude > this.altitudeThresholds.space) return 'space';
    if (this.currentAltitude > this.altitudeThresholds.regional) return 'regional';
    if (this.currentAltitude > this.altitudeThresholds.local) return 'local';
    return 'detailed';
  }
  
  /**
   * Manually set LOD level
   */
  setLevel(level: 'space' | 'regional' | 'local' | 'detailed') {
    const altitudes = {
      space: this.altitudeThresholds.space + 1000000,
      regional: this.altitudeThresholds.regional + 100000,
      local: this.altitudeThresholds.local + 10000,
      detailed: this.altitudeThresholds.detailed - 1000
    };
    
    this.updateLOD(altitudes[level]);
  }
  
  /**
   * Optimize for performance
   */
  enablePerformanceMode() {
    const scene = this.viewer.scene;
    const globe = scene.globe;
    
    // Aggressive optimization settings
    scene.requestRenderMode = true;
    scene.maximumRenderTimeChange = Infinity;
    globe.maximumScreenSpaceError = 4;
    globe.tileCacheSize = 100;
    
    // Disable expensive features
    scene.fog.enabled = false;
    scene.globe.enableLighting = false;
    scene.globe.showGroundAtmosphere = false;
    scene.skyAtmosphere.show = false;
    
    // Reduce shadow quality
    this.viewer.shadowMap.enabled = false;
  }
  
  /**
   * Enable quality mode
   */
  enableQualityMode() {
    const scene = this.viewer.scene;
    const globe = scene.globe;
    
    // Quality settings
    scene.requestRenderMode = false;
    globe.maximumScreenSpaceError = 1;
    globe.tileCacheSize = 2000;
    
    // Enable visual features
    scene.fog.enabled = true;
    scene.globe.enableLighting = true;
    scene.globe.showGroundAtmosphere = true;
    scene.skyAtmosphere.show = true;
    
    // Maximum shadow quality
    this.viewer.shadowMap.enabled = true;
    this.viewer.shadowMap.size = 4096;
  }
  
  /**
   * Clean up event listeners
   */
  destroy() {
    this.viewer.camera.changed.removeEventListener(() => {});
  }
}