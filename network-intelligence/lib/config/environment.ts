/**
 * Environment Configuration
 * Centralized configuration for different environments
 */

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

export interface EnvironmentConfig {
  env: Environment
  isProduction: boolean
  isDevelopment: boolean
  isStaging: boolean
  isTest: boolean

  // API Configuration
  api: {
    baseUrl: string
    timeout: number
    retryAttempts: number
    retryDelay: number
  }

  // Feature Flags
  features: {
    enableAnalytics: boolean
    enableErrorReporting: boolean
    enablePerformanceMonitoring: boolean
    enableAIInsights: boolean
    enableDebugMode: boolean
    enableExperimentalFeatures: boolean
    enableValhallaRouting: boolean
  }

  // Performance Settings
  performance: {
    maxHexagons: number
    maxStations: number
    chunkSize: number
    autoRefreshInterval: number
    enableVirtualization: boolean
    enableLazyLoading: boolean
  }

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    enableConsole: boolean
    enableRemote: boolean
    maxLogs: number
  }

  // Map Configuration
  map: {
    defaultZoom: number
    defaultCenter: [number, number]
    maxZoom: number
    minZoom: number
    enableTerrain: boolean
    enable3D: boolean
  }

  // External Services
  services: {
    mapbox: {
      token: string
      style: string
    }
    vultr: {
      apiKey: string
      model: string
      baseUrl: string
    }
    valhalla: {
      url: string
      enabled: boolean
    }
  }
}

/**
 * Get current environment
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development'

  switch (env.toLowerCase()) {
    case 'production':
    case 'prod':
      return Environment.PRODUCTION
    case 'staging':
    case 'stage':
      return Environment.STAGING
    case 'test':
    case 'testing':
      return Environment.TEST
    default:
      return Environment.DEVELOPMENT
  }
}

/**
 * Development configuration
 */
const developmentConfig: EnvironmentConfig = {
  env: Environment.DEVELOPMENT,
  isProduction: false,
  isDevelopment: true,
  isStaging: false,
  isTest: false,

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
    retryAttempts: 2,
    retryDelay: 1000
  },

  features: {
    enableAnalytics: false,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    enableAIInsights: true,
    enableDebugMode: true,
    enableExperimentalFeatures: true,
    enableValhallaRouting: true
  },

  performance: {
    maxHexagons: 5000,
    maxStations: 1000,
    chunkSize: 50,
    autoRefreshInterval: 60000,
    enableVirtualization: true,
    enableLazyLoading: true
  },

  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
    maxLogs: 1000
  },

  map: {
    defaultZoom: 2,
    defaultCenter: [0, 30],
    maxZoom: 20,
    minZoom: 1,
    enableTerrain: true,
    enable3D: true
  },

  services: {
    mapbox: {
      token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibG9vbmV5Z2lzIiwiYSI6ImNtZTh1M2hoaDBmZXkydXEyODM3N2U0aGoifQ.cDThnvgRCd8YfFY8d6L3Mg',
      style: 'mapbox://styles/mapbox/dark-v11'
    },
    vultr: {
      apiKey: process.env.VULTR_API_KEY || process.env.NEXT_PUBLIC_VULTR_API_KEY || '',
      model: 'qwen2.5-32b-instruct',
      baseUrl: 'https://api.vultrinference.com/v1'
    },
    valhalla: {
      url: process.env.NEXT_PUBLIC_VALHALLA_URL || 'http://localhost:8002',
      enabled: true
    }
  }
}

/**
 * Staging configuration
 */
const stagingConfig: EnvironmentConfig = {
  ...developmentConfig,
  env: Environment.STAGING,
  isProduction: false,
  isDevelopment: false,
  isStaging: true,
  isTest: false,

  features: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    enableAIInsights: true,
    enableDebugMode: false,
    enableExperimentalFeatures: true,
    enableValhallaRouting: true
  },

  logging: {
    level: 'info',
    enableConsole: false,
    enableRemote: true,
    maxLogs: 500
  }
}

/**
 * Production configuration
 */
const productionConfig: EnvironmentConfig = {
  ...developmentConfig,
  env: Environment.PRODUCTION,
  isProduction: true,
  isDevelopment: false,
  isStaging: false,
  isTest: false,

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://nexusone.earth/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000
  },

  features: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    enableAIInsights: true,
    enableDebugMode: false,
    enableExperimentalFeatures: false,
    enableValhallaRouting: true
  },

  performance: {
    maxHexagons: 10000,
    maxStations: 2000,
    chunkSize: 100,
    autoRefreshInterval: 120000,
    enableVirtualization: true,
    enableLazyLoading: true
  },

  logging: {
    level: 'warn',
    enableConsole: false,
    enableRemote: true,
    maxLogs: 200
  },

  map: {
    defaultZoom: 2,
    defaultCenter: [0, 30],
    maxZoom: 18,
    minZoom: 2,
    enableTerrain: true,
    enable3D: true
  }
}

/**
 * Test configuration
 */
const testConfig: EnvironmentConfig = {
  ...developmentConfig,
  env: Environment.TEST,
  isProduction: false,
  isDevelopment: false,
  isStaging: false,
  isTest: true,

  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 5000,
    retryAttempts: 0,
    retryDelay: 0
  },

  features: {
    enableAnalytics: false,
    enableErrorReporting: false,
    enablePerformanceMonitoring: false,
    enableAIInsights: false,
    enableDebugMode: true,
    enableExperimentalFeatures: true,
    enableValhallaRouting: false
  },

  performance: {
    maxHexagons: 100,
    maxStations: 50,
    chunkSize: 10,
    autoRefreshInterval: 10000,
    enableVirtualization: false,
    enableLazyLoading: false
  },

  logging: {
    level: 'error',
    enableConsole: false,
    enableRemote: false,
    maxLogs: 50
  }
}

/**
 * Get configuration for current environment
 */
export function getConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment()

  switch (env) {
    case Environment.PRODUCTION:
      return productionConfig
    case Environment.STAGING:
      return stagingConfig
    case Environment.TEST:
      return testConfig
    case Environment.DEVELOPMENT:
    default:
      return developmentConfig
  }
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  return getConfig().features[feature]
}

/**
 * Get API configuration
 */
export function getApiConfig() {
  return getConfig().api
}

/**
 * Get performance configuration
 */
export function getPerformanceConfig() {
  return getConfig().performance
}

/**
 * Get logging configuration
 */
export function getLoggingConfig() {
  return getConfig().logging
}

/**
 * Get map configuration
 */
export function getMapConfig() {
  return getConfig().map
}

/**
 * Get service configuration
 */
export function getServiceConfig(service: keyof EnvironmentConfig['services']) {
  return getConfig().services[service]
}

// Export config object for convenience
export const config = getConfig()

export default {
  Environment,
  getCurrentEnvironment,
  getConfig,
  isFeatureEnabled,
  getApiConfig,
  getPerformanceConfig,
  getLoggingConfig,
  getMapConfig,
  getServiceConfig,
  config
}
