'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { SimpleMeshLayer } from '@deck.gl/mesh-layers'
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { SphereGeometry } from '@luma.gl/engine'
import * as satellite from 'satellite.js'

// MEO constellation configuration for O3b mPOWER
const MEO_CONFIG = {
  o3b_classic: {
    altitude: 8062, // km
    inclination: 0, // degrees (equatorial)
    satellites: 20,
    color: [59, 130, 246, 255] // Blue
  },
  o3b_mpower: {
    altitude: 8062, // km
    inclination: 0, // degrees (equatorial)
    satellites: 11, // Currently operational, expanding to 42
    color: [16, 185, 129, 255] // Green
  }
}

const EARTH_RADIUS_KM = 6371

export interface MEOSatellite {
  id: string
  name: string
  constellation: string
  position: [number, number, number] // [lon, lat, alt in km]
  velocity?: [number, number, number]
  noradId?: string
  tle?: {
    line1: string
    line2: string
  }
}

interface MEOGlobeLayerProps {
  satellites?: MEOSatellite[]
  showOrbits?: boolean
  showFootprints?: boolean
  showEarth?: boolean
  currentTime?: Date
}

export function createMEOGlobeLayers({
  satellites = [],
  showOrbits = true,
  showFootprints = true,
  showEarth = true,
  currentTime = new Date()
}: MEOGlobeLayerProps) {
  const layers = []

  // Earth sphere layer with proper 3D rendering
  if (showEarth) {
    layers.push(
      new SimpleMeshLayer({
        id: 'earth-sphere',
        data: [{ position: [0, 0, 0] }],
        mesh: new SphereGeometry({
          radius: EARTH_RADIUS_KM,
          nlat: 50,
          nlong: 100
        }),
        coordinateSystem: 3, // COORDINATE_SYSTEM.GLOBE
        getPosition: d => d.position,
        getColor: [30, 60, 90, 255], // Deep blue ocean
        material: {
          ambient: 0.35,
          diffuse: 0.6,
          shininess: 32,
          specularColor: [60, 64, 70]
        },
        wireframe: false
      })
    )

    // Add continent outlines for reference
    layers.push(
      new SimpleMeshLayer({
        id: 'earth-continents',
        data: [{ position: [0, 0, 0] }],
        mesh: new SphereGeometry({
          radius: EARTH_RADIUS_KM + 10, // Slightly above Earth surface
          nlat: 50,
          nlong: 100
        }),
        coordinateSystem: 3,
        getPosition: d => d.position,
        getColor: [34, 139, 34, 100], // Semi-transparent green for land
        material: {
          ambient: 0.4,
          diffuse: 0.6
        },
        wireframe: true
      })
    )
  }

  // MEO orbit rings at 8,062km altitude
  if (showOrbits) {
    const orbitRadius = EARTH_RADIUS_KM + MEO_CONFIG.o3b_mpower.altitude

    // Generate equatorial orbit path for MEO
    const orbitPath = []
    for (let lon = -180; lon <= 180; lon += 5) {
      orbitPath.push([
        lon,
        0, // Equatorial orbit
        MEO_CONFIG.o3b_mpower.altitude
      ])
    }

    layers.push(
      new PathLayer({
        id: 'meo-orbit-ring',
        data: [{ path: orbitPath }],
        getPath: d => d.path,
        getColor: [100, 200, 255, 150],
        getWidth: 3,
        widthMinPixels: 2,
        widthMaxPixels: 5,
        billboard: false,
        capRounded: true,
        jointRounded: true
      })
    )

    // Add altitude indicator
    layers.push(
      new TextLayer({
        id: 'meo-altitude-label',
        data: [{ position: [0, 0, MEO_CONFIG.o3b_mpower.altitude], text: 'MEO: 8,062 km' }],
        getPosition: d => d.position,
        getText: d => d.text,
        getSize: 18,
        getColor: [255, 255, 255, 255],
        billboard: true,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        backgroundColor: [0, 0, 0, 200],
        backgroundPadding: [8, 4]
      })
    )
  }

  // MEO satellites with proper positioning
  if (satellites.length > 0) {
    // Calculate real positions using satellite.js if TLE available
    const positionedSatellites = satellites.map(sat => {
      if (sat.tle) {
        try {
          const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2)
          const positionAndVelocity = satellite.propagate(satrec, currentTime)
          
          if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
            const gmst = satellite.gstime(currentTime)
            const geodeticCoords = satellite.eciToGeodetic(positionAndVelocity.position as any, gmst)
            
            return {
              ...sat,
              position: [
                satellite.degreesLong(geodeticCoords.longitude),
                satellite.degreesLat(geodeticCoords.latitude),
                geodeticCoords.height // km above Earth
              ] as [number, number, number]
            }
          }
        } catch (e) {
          console.warn('Failed to calculate satellite position:', e)
        }
      }
      
      // Fallback to provided position or default MEO orbit
      return {
        ...sat,
        position: sat.position || [0, 0, MEO_CONFIG.o3b_mpower.altitude]
      }
    })

    layers.push(
      new ScatterplotLayer({
        id: 'meo-satellites',
        data: positionedSatellites,
        
        getPosition: d => d.position,
        getRadius: 50000, // 50km visual radius for MEO satellites
        radiusMinPixels: 4,
        radiusMaxPixels: 12,
        
        getFillColor: d => {
          if (d.constellation === 'O3b mPOWER') return MEO_CONFIG.o3b_mpower.color
          if (d.constellation === 'O3b') return MEO_CONFIG.o3b_classic.color
          return [255, 255, 255, 255]
        },
        
        getLineColor: [255, 255, 255, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        filled: true,
        
        pickable: true,
        billboard: true
      })
    )

    // Add satellite labels for MEO satellites
    layers.push(
      new TextLayer({
        id: 'meo-satellite-labels',
        data: positionedSatellites.filter(s => s.constellation?.includes('O3b')),
        
        getPosition: d => d.position,
        getText: d => d.name,
        getSize: 12,
        getColor: [255, 255, 255, 255],
        
        billboard: true,
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'bottom',
        getPixelOffset: [0, -15],
        
        backgroundColor: [0, 0, 0, 180],
        backgroundPadding: [4, 2]
      })
    )
  }

  // MEO beam footprints (smaller than LEO, larger than GEO)
  if (showFootprints && satellites.length > 0) {
    const meoSatellites = satellites.filter(s => s.constellation?.includes('O3b'))
    
    layers.push(
      new ScatterplotLayer({
        id: 'meo-footprints',
        data: meoSatellites,
        
        getPosition: d => [d.position[0], d.position[1], 0], // Project to Earth surface
        getRadius: 1500000, // 1,500km footprint radius for MEO
        radiusMinPixels: 20,
        radiusMaxPixels: 100,
        
        getFillColor: [100, 200, 255, 30],
        getLineColor: [100, 200, 255, 100],
        lineWidthMinPixels: 1,
        
        stroked: true,
        filled: true,
        pickable: false
      })
    )
  }

  return layers
}

// Helper function to generate MEO satellite TLE data
export function generateMEOSatellites(): MEOSatellite[] {
  const satellites: MEOSatellite[] = []
  
  // O3b mPOWER satellites (11 operational, expanding to 42)
  const mPowerCount = 11
  for (let i = 0; i < mPowerCount; i++) {
    const longitude = (i * 360 / mPowerCount) - 180
    satellites.push({
      id: `o3b-mpower-${i + 1}`,
      name: `O3b mPOWER ${i + 1}`,
      constellation: 'O3b mPOWER',
      position: [longitude, 0, MEO_CONFIG.o3b_mpower.altitude],
      // Note: Real TLE data should be fetched from CelesTrak
      tle: {
        line1: `1 ${50000 + i}U 23001A   24316.00000000  .00000000  00000-0  00000-0 0  9999`,
        line2: `2 ${50000 + i}   0.0000 ${longitude.toFixed(4).padStart(8)} 0000000   0.0000   0.0000 1.80223668    10`
      }
    })
  }
  
  // O3b Classic satellites (20 operational)
  const classicCount = 20
  for (let i = 0; i < classicCount; i++) {
    const longitude = (i * 360 / classicCount) - 180
    satellites.push({
      id: `o3b-classic-${i + 1}`,
      name: `O3b ${i + 1}`,
      constellation: 'O3b',
      position: [longitude, 0, MEO_CONFIG.o3b_classic.altitude],
      tle: {
        line1: `1 ${40000 + i}U 13001A   24316.00000000  .00000000  00000-0  00000-0 0  9999`,
        line2: `2 ${40000 + i}   0.0000 ${longitude.toFixed(4).padStart(8)} 0000000   0.0000   0.0000 1.80223668    10`
      }
    })
  }
  
  return satellites
}

// Calculate MEO-specific advantages
export function calculateMEOAdvantages(latitude: number, longitude: number) {
  const meoAltitude = MEO_CONFIG.o3b_mpower.altitude
  const geoAltitude = 35786 // km
  
  // Calculate round-trip latency (simplified)
  const speedOfLight = 299792 // km/s
  const meoLatency = (2 * meoAltitude / speedOfLight) * 1000 // ms
  const geoLatency = (2 * geoAltitude / speedOfLight) * 1000 // ms
  
  // Calculate coverage area (simplified)
  const earthRadius = EARTH_RADIUS_KM
  const meoHorizon = Math.sqrt(2 * earthRadius * meoAltitude) // km
  const geoHorizon = Math.sqrt(2 * earthRadius * geoAltitude) // km
  
  return {
    meoLatency: Math.round(meoLatency),
    geoLatency: Math.round(geoLatency),
    latencyAdvantage: Math.round(geoLatency - meoLatency),
    meoCoverageRadius: Math.round(meoHorizon),
    geoCoverageRadius: Math.round(geoHorizon),
    beamsPerSatellite: 4500, // O3b mPOWER capability
    throughputPerBeam: 10, // Gbps
    handoverFrequency: '30-45 min', // MEO pass duration
    constellationSize: {
      current: 11,
      planned: 42
    }
  }
}