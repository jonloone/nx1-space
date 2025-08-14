'use client'

import * as Cesium from 'cesium'
import { 
  detectWebGLCapabilities, 
  findOptimalWebGLConfig, 
  generateWebGLReport,
  type WebGLCapabilities,
  type WebGLContextConfig 
} from './webglDetection'

export interface CesiumInitializationConfig {
  container: HTMLElement
  webglConfig?: WebGLContextConfig
  performanceLevel: 'high' | 'medium' | 'low' | 'minimal'
  useTerrainProvider: boolean
  useIonImagery: boolean
  enableShadows: boolean
  enableFog: boolean
  enableLighting: boolean
  enableAntialiasing: boolean
  requestRenderMode: boolean
  maximumScreenSpaceError: number
  tileCacheSize: number
}

export interface CesiumInitializationResult {
  viewer: Cesium.Viewer | null
  success: boolean
  config: CesiumInitializationConfig
  webglCapabilities: WebGLCapabilities
  errorMessage?: string
  performanceMetrics: {
    initializationTime: number
    terrainLoadTime: number
    imageryLoadTime: number
    firstRenderTime: number
  }
}

export interface TerrainProviderConfig {
  primary: () => Promise<Cesium.TerrainProvider>
  fallback: () => Cesium.TerrainProvider
  name: string
}

export interface ImageryProviderConfig {
  primary: () => Promise<Cesium.ImageryProvider>
  fallback: () => Cesium.ImageryProvider
  name: string
}

export class CesiumContextManager {
  private webglCapabilities: WebGLCapabilities
  private optimalWebGLConfig: WebGLContextConfig | null = null
  private performanceMetrics = {
    initializationTime: 0,
    terrainLoadTime: 0,
    imageryLoadTime: 0,
    firstRenderTime: 0
  }

  constructor() {
    this.webglCapabilities = detectWebGLCapabilities()
    console.log('🔍 WebGL Environment:', generateWebGLReport(this.webglCapabilities))
  }

  // Initialize optimal WebGL configuration
  async initializeWebGLConfig(): Promise<WebGLContextConfig | null> {
    if (this.optimalWebGLConfig) {
      return this.optimalWebGLConfig
    }

    console.log('🔧 Finding optimal WebGL configuration...')
    this.optimalWebGLConfig = await findOptimalWebGLConfig(this.webglCapabilities)
    
    if (this.optimalWebGLConfig) {
      console.log('✅ WebGL configuration ready:', this.optimalWebGLConfig)
    } else {
      console.error('❌ No viable WebGL configuration found')
    }

    return this.optimalWebGLConfig
  }

  // Generate Cesium initialization configuration based on capabilities
  generateCesiumConfig(container: HTMLElement, overrides: Partial<CesiumInitializationConfig> = {}): CesiumInitializationConfig {
    const baseConfig: CesiumInitializationConfig = {
      container,
      webglConfig: this.optimalWebGLConfig || undefined,
      performanceLevel: this.webglCapabilities.performanceLevel === 'unsupported' 
        ? 'minimal' 
        : this.webglCapabilities.performanceLevel,
      useTerrainProvider: this.webglCapabilities.performanceLevel !== 'low',
      useIonImagery: this.webglCapabilities.performanceLevel === 'high',
      enableShadows: false, // Start conservative
      enableFog: this.webglCapabilities.performanceLevel !== 'low',
      enableLighting: this.webglCapabilities.performanceLevel === 'high',
      enableAntialiasing: this.webglCapabilities.performanceLevel === 'high' && !this.webglCapabilities.isVirtualized,
      requestRenderMode: true, // Always use for performance
      maximumScreenSpaceError: this.getOptimalScreenSpaceError(),
      tileCacheSize: this.getOptimalTileCacheSize()
    }

    return { ...baseConfig, ...overrides }
  }

  // Get terrain provider configurations with fallbacks
  getTerrainProviderConfigs(): TerrainProviderConfig[] {
    return [
      {
        name: 'Cesium World Terrain',
        primary: async () => {
          console.log('🌍 Loading Cesium World Terrain...')
          const startTime = performance.now()
          try {
            const provider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1, {
              requestWaterMask: this.webglCapabilities.performanceLevel === 'high',
              requestVertexNormals: this.webglCapabilities.performanceLevel !== 'low'
            })
            this.performanceMetrics.terrainLoadTime = performance.now() - startTime
            console.log(`✅ Cesium World Terrain loaded in ${this.performanceMetrics.terrainLoadTime.toFixed(0)}ms`)
            return provider
          } catch (error) {
            console.warn('⚠️  Cesium World Terrain failed:', error)
            throw error
          }
        },
        fallback: () => {
          console.log('🌍 Using fallback ellipsoid terrain')
          return new Cesium.EllipsoidTerrainProvider()
        }
      }
    ]
  }

  // Get imagery provider configurations with fallbacks
  getImageryProviderConfigs(): ImageryProviderConfig[] {
    return [
      {
        name: 'Cesium World Imagery',
        primary: async () => {
          if (!this.shouldUseIonImagery()) {
            throw new Error('Ion imagery not recommended for this performance level')
          }
          console.log('🗺️  Loading Cesium World Imagery...')
          const startTime = performance.now()
          const provider = await Cesium.IonImageryProvider.fromAssetId(3, {
            maximumLevel: this.getOptimalImageryLevel()
          })
          this.performanceMetrics.imageryLoadTime = performance.now() - startTime
          console.log(`✅ Cesium World Imagery loaded in ${this.performanceMetrics.imageryLoadTime.toFixed(0)}ms`)
          return provider
        },
        fallback: () => this.createFallbackImageryProvider()
      },
      {
        name: 'ESRI World Imagery',
        primary: async () => {
          console.log('🗺️  Loading ESRI World Imagery...')
          const startTime = performance.now()
          const provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            {
              enablePickFeatures: false,
              maximumLevel: this.getOptimalImageryLevel()
            }
          )
          this.performanceMetrics.imageryLoadTime = performance.now() - startTime
          console.log(`✅ ESRI World Imagery loaded in ${this.performanceMetrics.imageryLoadTime.toFixed(0)}ms`)
          return provider
        },
        fallback: () => this.createFallbackImageryProvider()
      }
    ]
  }

  // Initialize Cesium viewer with adaptive configuration
  async initializeCesiumViewer(config: CesiumInitializationConfig): Promise<CesiumInitializationResult> {
    const startTime = performance.now()
    
    try {
      console.log('🎬 Initializing Cesium viewer...')
      console.log('📊 Configuration:', {
        performanceLevel: config.performanceLevel,
        useTerrainProvider: config.useTerrainProvider,
        useIonImagery: config.useIonImagery,
        enableAntialiasing: config.enableAntialiasing,
        maximumScreenSpaceError: config.maximumScreenSpaceError
      })

      // Load terrain provider
      const terrainProvider = await this.loadTerrainProvider(config)
      
      // Load imagery provider
      const imageryProvider = await this.loadImageryProvider(config)

      // Create viewer with optimal settings
      const viewer = new Cesium.Viewer(config.container, {
        // Providers
        terrainProvider,
        imageryProvider,
        baseLayerPicker: false, // We control this programmatically
        
        // UI Configuration (minimize for performance)
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        geocoder: false,
        creditContainer: document.createElement('div'), // Hide credits
        
        // Performance settings
        scene3DOnly: config.performanceLevel === 'low',
        sceneMode: Cesium.SceneMode.SCENE3D,
        shouldAnimate: config.performanceLevel !== 'minimal',
        
        // Rendering options
        contextOptions: config.webglConfig,
        requestRenderMode: config.requestRenderMode,
        maximumRenderTimeChange: config.performanceLevel === 'high' ? Infinity : 16
      })

      // Configure scene settings
      this.configureScene(viewer, config)
      
      // Set initial camera position
      this.setInitialCameraPosition(viewer, config)
      
      // Record initialization time
      this.performanceMetrics.initializationTime = performance.now() - startTime
      
      console.log(`✅ Cesium viewer initialized successfully in ${this.performanceMetrics.initializationTime.toFixed(0)}ms`)
      
      return {
        viewer,
        success: true,
        config,
        webglCapabilities: this.webglCapabilities,
        performanceMetrics: { ...this.performanceMetrics }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'
      console.error('❌ Cesium viewer initialization failed:', error)
      
      return {
        viewer: null,
        success: false,
        config,
        webglCapabilities: this.webglCapabilities,
        errorMessage,
        performanceMetrics: { ...this.performanceMetrics }
      }
    }
  }

  // Load terrain provider with fallbacks
  private async loadTerrainProvider(config: CesiumInitializationConfig): Promise<Cesium.TerrainProvider> {
    if (!config.useTerrainProvider) {
      console.log('🌍 Using ellipsoid terrain (performance optimization)')
      return new Cesium.EllipsoidTerrainProvider()
    }

    const terrainConfigs = this.getTerrainProviderConfigs()
    
    for (const terrainConfig of terrainConfigs) {
      try {
        return await terrainConfig.primary()
      } catch (error) {
        console.warn(`⚠️  ${terrainConfig.name} failed, trying fallback:`, error)
        return terrainConfig.fallback()
      }
    }
    
    // Final fallback
    console.log('🌍 Using final fallback ellipsoid terrain')
    return new Cesium.EllipsoidTerrainProvider()
  }

  // Load imagery provider with fallbacks
  private async loadImageryProvider(config: CesiumInitializationConfig): Promise<Cesium.ImageryProvider> {
    const imageryConfigs = this.getImageryProviderConfigs()
    
    for (const imageryConfig of imageryConfigs) {
      try {
        return await imageryConfig.primary()
      } catch (error) {
        console.warn(`⚠️  ${imageryConfig.name} failed, trying next:`, error)
        continue
      }
    }
    
    // Final fallback
    console.log('🗺️  Using final fallback imagery')
    return this.createFallbackImageryProvider()
  }

  // Configure scene based on performance level
  private configureScene(viewer: Cesium.Viewer, config: CesiumInitializationConfig): void {
    const scene = viewer.scene
    const globe = scene.globe
    
    // Globe settings
    globe.depthTestAgainstTerrain = config.performanceLevel !== 'minimal'
    globe.enableLighting = config.enableLighting
    globe.showGroundAtmosphere = config.performanceLevel !== 'minimal'
    globe.atmosphereBrightnessShift = -0.3 // Darken for better contrast
    globe.baseColor = Cesium.Color.fromCssColorString('#1a1a1a')
    
    // Performance optimizations
    scene.requestRenderMode = config.requestRenderMode
    scene.maximumRenderTimeChange = config.performanceLevel === 'high' ? Infinity : 16
    globe.tileCacheSize = config.tileCacheSize
    globe.maximumScreenSpaceError = config.maximumScreenSpaceError
    scene.logarithmicDepthBuffer = true
    scene.farToNearRatio = 1000
    
    // Fog settings
    if (config.enableFog) {
      scene.fog.enabled = true
      scene.fog.density = 0.0001
    }
    
    // Shadow settings
    scene.shadowMap.enabled = config.enableShadows
    
    // Configure camera controls
    const controller = scene.screenSpaceCameraController
    controller.enableRotate = true
    controller.enableTranslate = true
    controller.enableZoom = true
    controller.enableTilt = true
    controller.enableLook = false // Prevent wild spinning
    
    // Set movement limits
    controller.minimumZoomDistance = 1000 // 1km minimum
    controller.maximumZoomDistance = 20000000 // 20,000km maximum
    
    console.log('⚙️  Scene configured for', config.performanceLevel, 'performance level')
  }

  // Set initial camera position based on performance level
  private setInitialCameraPosition(viewer: Cesium.Viewer, config: CesiumInitializationConfig): void {
    const altitude = config.performanceLevel === 'low' ? 5000000 : 2000000 // Higher for low performance
    
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-77.5, 38.5, altitude),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0
      }
    })
  }

  // Helper methods
  private shouldUseIonImagery(): boolean {
    return this.webglCapabilities.performanceLevel === 'high' && !this.webglCapabilities.isVirtualized
  }

  private getOptimalScreenSpaceError(): number {
    switch (this.webglCapabilities.performanceLevel) {
      case 'high': return 1.0
      case 'medium': return 1.5
      case 'low': return 2.0
      default: return 3.0
    }
  }

  private getOptimalTileCacheSize(): number {
    switch (this.webglCapabilities.performanceLevel) {
      case 'high': return 1000
      case 'medium': return 500
      case 'low': return 200
      default: return 100
    }
  }

  private getOptimalImageryLevel(): number {
    switch (this.webglCapabilities.performanceLevel) {
      case 'high': return 19
      case 'medium': return 16
      case 'low': return 12
      default: return 8
    }
  }

  private createFallbackImageryProvider(): Cesium.ImageryProvider {
    console.log('🗺️  Creating fallback OpenStreetMap imagery')
    return new Cesium.OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/',
      maximumLevel: this.getOptimalImageryLevel()
    })
  }

  // Get current capabilities and metrics
  getCapabilities(): WebGLCapabilities {
    return this.webglCapabilities
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics }
  }
}