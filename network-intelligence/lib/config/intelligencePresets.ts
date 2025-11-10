/**
 * Intelligence View Presets
 * Pre-configured layer combinations for multi-INT narrative storytelling
 *
 * Presets combine multiple intelligence layers to support different
 * investigation focuses and analytical workflows.
 */

export interface IntelligencePreset {
  id: string
  name: string
  description: string
  icon: string
  category: 'multi-int' | 'sigint' | 'geoint' | 'osint' | 'temporal'

  // Layer Configuration
  layers: {
    buildings?: {
      enabled: boolean
      mode3D?: boolean
      colorMode?: 'poi-category' | 'alert-proximity' | 'attributes' | 'intelligence'
    }
    cellTowers?: {
      enabled: boolean
      showCoverage?: boolean
      operators?: string[]
    }
    places?: {
      enabled: boolean
      categories?: string[]
    }
    roads?: {
      enabled: boolean
    }
    addresses?: {
      enabled: boolean
    }
    landUse?: {
      enabled: boolean
    }
    heatmaps?: {
      enabled: boolean
      type?: 'frequency' | 'temporal' | 'risk'
    }
    alerts?: {
      enabled: boolean
      priorities?: string[]
    }
    routes?: {
      enabled: boolean
      animated?: boolean
    }
  }

  // Map Configuration
  mapStyle?: {
    pitch?: number
    bearing?: number
    zoom?: number
  }

  // Intelligence Focus
  intelFocus: {
    primary: 'surveillance' | 'network' | 'location' | 'pattern' | 'multi-source'
    domains: Array<'SIGINT' | 'OSINT' | 'GEOINT' | 'TEMPORAL' | 'NETWORK'>
  }
}

/**
 * Pre-defined intelligence view presets
 */
export const INTELLIGENCE_PRESETS: Record<string, IntelligencePreset> = {
  // Full Spectrum - All intelligence sources
  FULL_SPECTRUM: {
    id: 'full-spectrum',
    name: 'Full Spectrum Intelligence',
    description: 'All SIGINT + OSINT + GEOINT + Temporal layers combined for comprehensive analysis',
    icon: '🌐',
    category: 'multi-int',
    layers: {
      buildings: {
        enabled: true,
        mode3D: true,
        colorMode: 'intelligence'
      },
      cellTowers: {
        enabled: true,
        showCoverage: true,
        operators: ['Verizon', 'AT&T', 'T-Mobile', 'Sprint']
      },
      places: {
        enabled: true,
        categories: ['all']
      },
      roads: {
        enabled: true
      },
      addresses: {
        enabled: true
      },
      landUse: {
        enabled: true
      },
      heatmaps: {
        enabled: true,
        type: 'frequency'
      },
      alerts: {
        enabled: true,
        priorities: ['critical', 'high', 'medium']
      },
      routes: {
        enabled: true,
        animated: false
      }
    },
    mapStyle: {
      pitch: 45,
      bearing: 0,
      zoom: 14
    },
    intelFocus: {
      primary: 'multi-source',
      domains: ['SIGINT', 'OSINT', 'GEOINT', 'TEMPORAL', 'NETWORK']
    }
  },

  // Communications Focus - SIGINT emphasis
  COMMUNICATIONS_FOCUS: {
    id: 'communications-focus',
    name: 'Communications Intelligence',
    description: 'SIGINT-focused view with cell towers, coverage zones, and movement correlation',
    icon: '📡',
    category: 'sigint',
    layers: {
      buildings: {
        enabled: true,
        mode3D: false,
        colorMode: 'poi-category'
      },
      cellTowers: {
        enabled: true,
        showCoverage: true,
        operators: ['Verizon', 'AT&T', 'T-Mobile']
      },
      places: {
        enabled: false
      },
      roads: {
        enabled: true
      },
      addresses: {
        enabled: false
      },
      landUse: {
        enabled: false
      },
      heatmaps: {
        enabled: false
      },
      alerts: {
        enabled: true,
        priorities: ['critical', 'high']
      },
      routes: {
        enabled: true,
        animated: true
      }
    },
    mapStyle: {
      pitch: 0,
      bearing: 0,
      zoom: 13
    },
    intelFocus: {
      primary: 'surveillance',
      domains: ['SIGINT', 'GEOINT', 'TEMPORAL']
    }
  },

  // Pattern of Life - Temporal analysis
  PATTERN_OF_LIFE: {
    id: 'pattern-of-life',
    name: 'Pattern-of-Life Analysis',
    description: 'Temporal heatmaps, frequent locations, and behavioral pattern detection',
    icon: '⏰',
    category: 'temporal',
    layers: {
      buildings: {
        enabled: true,
        mode3D: false,
        colorMode: 'poi-category'
      },
      cellTowers: {
        enabled: false
      },
      places: {
        enabled: true,
        categories: ['restaurant', 'cafe', 'retail', 'office', 'residential']
      },
      roads: {
        enabled: true
      },
      addresses: {
        enabled: true
      },
      landUse: {
        enabled: true
      },
      heatmaps: {
        enabled: true,
        type: 'temporal'
      },
      alerts: {
        enabled: true,
        priorities: ['critical', 'high', 'medium']
      },
      routes: {
        enabled: true,
        animated: true
      }
    },
    mapStyle: {
      pitch: 0,
      bearing: 0,
      zoom: 14
    },
    intelFocus: {
      primary: 'pattern',
      domains: ['TEMPORAL', 'OSINT', 'GEOINT']
    }
  },

  // Infrastructure Focus - Buildings, transportation, land use
  INFRASTRUCTURE: {
    id: 'infrastructure',
    name: 'Infrastructure Intelligence',
    description: '3D buildings, roads, land use, and SIGINT infrastructure overlay',
    icon: '🏗️',
    category: 'geoint',
    layers: {
      buildings: {
        enabled: true,
        mode3D: true,
        colorMode: 'attributes'
      },
      cellTowers: {
        enabled: true,
        showCoverage: false,
        operators: ['Verizon', 'AT&T', 'T-Mobile', 'Sprint']
      },
      places: {
        enabled: true,
        categories: ['industrial', 'port', 'transportation', 'commercial']
      },
      roads: {
        enabled: true
      },
      addresses: {
        enabled: true
      },
      landUse: {
        enabled: true
      },
      heatmaps: {
        enabled: false
      },
      alerts: {
        enabled: false
      },
      routes: {
        enabled: false
      }
    },
    mapStyle: {
      pitch: 60,
      bearing: -17.6,
      zoom: 15
    },
    intelFocus: {
      primary: 'location',
      domains: ['GEOINT', 'SIGINT']
    }
  },

  // Location-Centric - Focus on specific area
  LOCATION_CENTRIC: {
    id: 'location-centric',
    name: 'Location Intelligence',
    description: 'Detailed view of specific location with all nearby POIs, businesses, and activity',
    icon: '📍',
    category: 'geoint',
    layers: {
      buildings: {
        enabled: true,
        mode3D: true,
        colorMode: 'alert-proximity'
      },
      cellTowers: {
        enabled: true,
        showCoverage: true,
        operators: ['Verizon', 'AT&T', 'T-Mobile']
      },
      places: {
        enabled: true,
        categories: ['all']
      },
      roads: {
        enabled: true
      },
      addresses: {
        enabled: true
      },
      landUse: {
        enabled: true
      },
      heatmaps: {
        enabled: true,
        type: 'frequency'
      },
      alerts: {
        enabled: true,
        priorities: ['critical', 'high', 'medium', 'low']
      },
      routes: {
        enabled: false
      }
    },
    mapStyle: {
      pitch: 45,
      bearing: 0,
      zoom: 16
    },
    intelFocus: {
      primary: 'location',
      domains: ['GEOINT', 'OSINT', 'SIGINT']
    }
  },

  // OSINT Focus - Business and social intelligence
  OSINT_FOCUS: {
    id: 'osint-focus',
    name: 'Open Source Intelligence',
    description: 'Business data, social media indicators, ownership, and suspicious activity flags',
    icon: '🔍',
    category: 'osint',
    layers: {
      buildings: {
        enabled: true,
        mode3D: false,
        colorMode: 'poi-category'
      },
      cellTowers: {
        enabled: false
      },
      places: {
        enabled: true,
        categories: ['all']
      },
      roads: {
        enabled: true
      },
      addresses: {
        enabled: true
      },
      landUse: {
        enabled: false
      },
      heatmaps: {
        enabled: false
      },
      alerts: {
        enabled: true,
        priorities: ['critical', 'high']
      },
      routes: {
        enabled: false
      }
    },
    mapStyle: {
      pitch: 0,
      bearing: 0,
      zoom: 15
    },
    intelFocus: {
      primary: 'location',
      domains: ['OSINT', 'GEOINT']
    }
  },

  // Surveillance Mode - Subject tracking
  SURVEILLANCE_MODE: {
    id: 'surveillance-mode',
    name: 'Subject Surveillance',
    description: 'Real-time tracking view with routes, cell towers, and alert proximity',
    icon: '👁️',
    category: 'multi-int',
    layers: {
      buildings: {
        enabled: true,
        mode3D: false,
        colorMode: 'alert-proximity'
      },
      cellTowers: {
        enabled: true,
        showCoverage: true,
        operators: ['Verizon', 'AT&T', 'T-Mobile']
      },
      places: {
        enabled: true,
        categories: ['all']
      },
      roads: {
        enabled: true
      },
      addresses: {
        enabled: true
      },
      landUse: {
        enabled: false
      },
      heatmaps: {
        enabled: true,
        type: 'frequency'
      },
      alerts: {
        enabled: true,
        priorities: ['critical', 'high']
      },
      routes: {
        enabled: true,
        animated: true
      }
    },
    mapStyle: {
      pitch: 0,
      bearing: 0,
      zoom: 14
    },
    intelFocus: {
      primary: 'surveillance',
      domains: ['GEOINT', 'SIGINT', 'TEMPORAL']
    }
  },

  // Network Analysis - Connections and relationships
  NETWORK_ANALYSIS: {
    id: 'network-analysis',
    name: 'Network & Associates',
    description: 'Relationship mapping with shared locations, co-location patterns, and connections',
    icon: '🕸️',
    category: 'multi-int',
    layers: {
      buildings: {
        enabled: true,
        mode3D: false,
        colorMode: 'intelligence'
      },
      cellTowers: {
        enabled: false
      },
      places: {
        enabled: true,
        categories: ['all']
      },
      roads: {
        enabled: true
      },
      addresses: {
        enabled: true
      },
      landUse: {
        enabled: false
      },
      heatmaps: {
        enabled: true,
        type: 'frequency'
      },
      alerts: {
        enabled: true,
        priorities: ['critical', 'high']
      },
      routes: {
        enabled: false
      }
    },
    mapStyle: {
      pitch: 0,
      bearing: 0,
      zoom: 13
    },
    intelFocus: {
      primary: 'network',
      domains: ['NETWORK', 'OSINT', 'GEOINT']
    }
  }
}

/**
 * Get preset by ID
 */
export function getPreset(presetId: string): IntelligencePreset | null {
  return INTELLIGENCE_PRESETS[presetId.toUpperCase()] || null
}

/**
 * Get all presets by category
 */
export function getPresetsByCategory(category: IntelligencePreset['category']): IntelligencePreset[] {
  return Object.values(INTELLIGENCE_PRESETS).filter(preset => preset.category === category)
}

/**
 * Get all preset IDs
 */
export function getAllPresetIds(): string[] {
  return Object.keys(INTELLIGENCE_PRESETS)
}

/**
 * Get presets by intelligence domain
 */
export function getPresetsByDomain(domain: 'SIGINT' | 'OSINT' | 'GEOINT' | 'TEMPORAL' | 'NETWORK'): IntelligencePreset[] {
  return Object.values(INTELLIGENCE_PRESETS).filter(preset =>
    preset.intelFocus.domains.includes(domain)
  )
}

/**
 * Get recommended preset for investigation focus
 */
export function getRecommendedPreset(focus: 'surveillance' | 'network' | 'location' | 'pattern'): IntelligencePreset {
  const recommendations = {
    'surveillance': INTELLIGENCE_PRESETS.SURVEILLANCE_MODE,
    'network': INTELLIGENCE_PRESETS.NETWORK_ANALYSIS,
    'location': INTELLIGENCE_PRESETS.LOCATION_CENTRIC,
    'pattern': INTELLIGENCE_PRESETS.PATTERN_OF_LIFE
  }

  return recommendations[focus] || INTELLIGENCE_PRESETS.FULL_SPECTRUM
}
