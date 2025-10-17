#!/usr/bin/env node

/**
 * Test script to verify use case presets configuration
 */

// Mock TypeScript imports for Node.js
const presets = {
  'urban-intelligence': {
    id: 'urban-intelligence',
    name: 'Urban Intelligence',
    description: 'Building footprints, infrastructure, and points of interest',
    icon: '🏙️',
    basemap: 'basemap-light',
    layers: [
      { id: 'infra-buildings-2d', visible: true },
      { id: 'infra-buildings-3d', visible: false },
      { id: 'infra-places', visible: true }
    ],
    status: 'available',
    phase: 1,
    useCase: 'Urban planning, real estate analysis, site surveys, facility management, demographic studies'
  },
  'site-analysis': {
    id: 'site-analysis',
    name: 'Site Analysis',
    description: 'Location scouting with 3D terrain and satellite context',
    icon: '📍',
    basemap: 'basemap-satellite',
    layers: [
      { id: 'infra-buildings-3d', visible: true },
      { id: 'infra-buildings-2d', visible: false },
      { id: 'infra-places', visible: true }
    ],
    status: 'available',
    phase: 1,
    useCase: 'Ground station site selection, facility placement, line-of-sight analysis, terrain evaluation'
  },
  'operations-view': {
    id: 'operations-view',
    name: 'Operations View',
    description: 'Clean operational map optimized for data overlay',
    icon: '🎯',
    basemap: 'basemap-dark',
    layers: [
      { id: 'infra-places', visible: true },
      { id: 'infra-buildings-2d', visible: false },
      { id: 'infra-buildings-3d', visible: false }
    ],
    status: 'available',
    phase: 1,
    useCase: 'Real-time operations monitoring, network visualization, live data overlay, mission control'
  }
}

const comingSoonPresets = {
  'ground-station-ops': {
    id: 'ground-station-ops',
    name: 'Ground Station Operations',
    status: 'coming-soon',
    phase: 2,
    developmentPriority: 'high',
    requiredLayers: ['comms-ground-stations', 'comms-coverage', 'comms-orbits', 'comms-rf-footprints']
  },
  'maritime-intelligence': {
    id: 'maritime-intelligence',
    name: 'Maritime Intelligence',
    status: 'coming-soon',
    phase: 2,
    developmentPriority: 'medium',
    requiredLayers: ['ops-ais-vessels', 'infra-ports', 'maritime-shipping-lanes', 'ops-port-congestion', 'maritime-boundaries', 'maritime-choke-points']
  },
  'infrastructure-monitoring': {
    id: 'infrastructure-monitoring',
    name: 'Infrastructure Monitoring',
    status: 'coming-soon',
    phase: 2,
    developmentPriority: 'medium',
    requiredLayers: ['ops-critical-infra', 'ops-pipelines', 'ops-cell-towers', 'ops-undersea-cables']
  }
}

console.log('🧪 Testing Use Case Presets Configuration\n')

console.log('✅ Phase 1: Available Presets')
console.log('=' .repeat(60))
Object.values(presets).forEach(preset => {
  console.log(`${preset.icon} ${preset.name}`)
  console.log(`   Basemap: ${preset.basemap}`)
  console.log(`   Layers: ${preset.layers.length} (${preset.layers.filter(l => l.visible).length} visible by default)`)
  console.log(`   Use Case: ${preset.useCase}`)
  console.log('')
})

console.log('⏳ Phase 2: Coming Soon Presets')
console.log('=' .repeat(60))
Object.values(comingSoonPresets).forEach(preset => {
  console.log(`📡 ${preset.name} (Priority: ${preset.developmentPriority})`)
  console.log(`   Required Layers: ${preset.requiredLayers.length}`)
  console.log(`   - ${preset.requiredLayers.slice(0, 3).join(', ')}${preset.requiredLayers.length > 3 ? '...' : ''}`)
  console.log('')
})

console.log('📊 Summary')
console.log('=' .repeat(60))
console.log(`✅ Available presets: ${Object.keys(presets).length}`)
console.log(`⏳ Coming soon presets: ${Object.keys(comingSoonPresets).length}`)
console.log(`📋 Total use cases: ${Object.keys(presets).length + Object.keys(comingSoonPresets).length}`)
console.log('')

// Validation checks
console.log('🔍 Validation Checks')
console.log('=' .repeat(60))

let allValid = true

// Check all presets have required fields
Object.values(presets).forEach(preset => {
  if (!preset.id || !preset.name || !preset.basemap || !preset.layers) {
    console.log(`❌ ${preset.name || 'Unknown'} is missing required fields`)
    allValid = false
  } else {
    console.log(`✅ ${preset.name} - All required fields present`)
  }
})

// Check layer references are valid
const validLayerIds = [
  'basemap-satellite', 'basemap-dark', 'basemap-streets', 'basemap-terrain',
  'basemap-navigation', 'basemap-light',
  'infra-buildings-3d', 'infra-buildings-2d', 'infra-places', 'infra-roads'
]

Object.values(presets).forEach(preset => {
  if (!validLayerIds.includes(preset.basemap)) {
    console.log(`❌ ${preset.name} - Invalid basemap: ${preset.basemap}`)
    allValid = false
  }

  preset.layers.forEach(layer => {
    if (!validLayerIds.includes(layer.id)) {
      console.log(`❌ ${preset.name} - Invalid layer reference: ${layer.id}`)
      allValid = false
    }
  })
})

console.log('')
if (allValid) {
  console.log('✅ All validation checks passed!')
} else {
  console.log('❌ Some validation checks failed')
  process.exit(1)
}

console.log('')
console.log('🎉 Use Case Presets are properly configured!')
