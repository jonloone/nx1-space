'use client'

import React, { useEffect, useState, useMemo } from 'react'
import DeckGL from '@deck.gl/react'
import { _GlobeView as GlobeView } from '@deck.gl/core'
import { SimpleMeshLayer } from '@deck.gl/mesh-layers'
import { PathLayer, ScatterplotLayer, TextLayer, LineLayer } from '@deck.gl/layers'
import { TileLayer } from '@deck.gl/geo-layers'
import { BitmapLayer } from '@deck.gl/layers'
import { SphereGeometry } from '@luma.gl/engine'
import * as satellite from 'satellite.js'

const EARTH_RADIUS_KM = 6371
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export interface Satellite3D {
  id: string
  name: string
  operator: string
  position: [number, number, number] // [lon, lat, alt in km]
  type: 'GEO' | 'MEO' | 'LEO'
  constellation?: string
  noradId?: string
  tle?: {
    line1: string
    line2: string
  }
}

export interface OrbitPath3D {
  id: string
  satelliteId: string
  positions: [number, number, number][]
  color: [number, number, number, number]
}

interface Enhanced3DGlobeProps {
  satellites?: Satellite3D[]
  orbits?: OrbitPath3D[]
  showOrbits?: boolean
  showSatellites?: boolean
  showCoverage?: boolean
  showEarthTexture?: boolean
  currentTime?: Date
  viewState?: any
  onViewStateChange?: (params: any) => void
}

export default function Enhanced3DGlobe({
  satellites = [],
  orbits = [],
  showOrbits = true,
  showSatellites = true,
  showCoverage = false,
  showEarthTexture = true,
  currentTime = new Date(),
  viewState,
  onViewStateChange
}: Enhanced3DGlobeProps) {
  const [globeViewState, setGlobeViewState] = useState({
    longitude: -40,
    latitude: 30,
    zoom: 0,
    pitch: 0,
    bearing: 0,
    maxZoom: 20,
    minZoom: -2
  })

  // Generate sample satellites if none provided
  const sampleSatellites = useMemo(() => {
    if (satellites.length > 0) return satellites
    
    const sats: Satellite3D[] = []
    
    // GEO satellites (geostationary)
    const geoLongitudes = [-130, -90, -45, 0, 45, 90, 130]
    geoLongitudes.forEach((lon, i) => {
      sats.push({
        id: `geo-${i}`,
        name: `GEO-${i + 1}`,
        operator: i % 2 === 0 ? 'SES' : 'Intelsat',
        position: [lon, 0, 35786], // GEO altitude
        type: 'GEO'
      })
    })
    
    // MEO satellites (O3b constellation)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      sats.push({
        id: `meo-${i}`,
        name: `O3b-${i + 1}`,
        operator: 'SES',
        position: [
          Math.cos(angle) * 180,
          Math.sin(angle) * 10, // Slight inclination
          8062 // MEO altitude for O3b
        ],
        type: 'MEO',
        constellation: 'O3b'
      })
    }
    
    // LEO satellites (Starlink-like)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2
      const inclination = 53 // degrees
      sats.push({
        id: `leo-${i}`,
        name: `LEO-${i + 1}`,
        operator: 'SpaceX',
        position: [
          Math.cos(angle) * 360 - 180,
          Math.sin(angle) * inclination,
          550 // LEO altitude
        ],
        type: 'LEO',
        constellation: 'Starlink'
      })
    }
    
    return sats
  }, [satellites])

  // Generate orbit paths for satellites
  const generatedOrbits = useMemo(() => {
    if (orbits.length > 0) return orbits
    
    const paths: OrbitPath3D[] = []
    
    sampleSatellites.forEach(sat => {
      const positions: [number, number, number][] = []
      const numPoints = sat.type === 'GEO' ? 2 : 100
      
      if (sat.type === 'GEO') {
        // Stationary orbit (just a point)
        positions.push(sat.position)
        positions.push(sat.position)
      } else {
        // Generate circular orbit
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2
          const baseLon = sat.position[0]
          const baseLat = sat.position[1]
          const altitude = sat.position[2]
          
          positions.push([
            (baseLon + (i / numPoints) * 360) % 360 - 180,
            baseLat * Math.cos(angle),
            altitude
          ])
        }
      }
      
      const color: [number, number, number, number] = 
        sat.type === 'GEO' ? [255, 200, 0, 180] :
        sat.type === 'MEO' ? [0, 255, 150, 180] :
        [100, 200, 255, 180]
      
      paths.push({
        id: `orbit-${sat.id}`,
        satelliteId: sat.id,
        positions,
        color
      })
    })
    
    return paths
  }, [sampleSatellites, orbits])

  const layers = useMemo(() => {
    const allLayers = []
    
    // Earth sphere with texture
    if (showEarthTexture) {
      // Earth sphere base
      allLayers.push(
        new SimpleMeshLayer({
          id: 'earth-sphere',
          data: [{ position: [0, 0, 0] }],
          mesh: new SphereGeometry({
            radius: EARTH_RADIUS_KM,
            nlat: 60,
            nlong: 120
          }),
          coordinateSystem: 3, // COORDINATE_SYSTEM.GLOBE
          getPosition: d => d.position,
          getColor: [20, 40, 70, 255], // Deep blue-gray
          material: {
            ambient: 0.4,
            diffuse: 0.8,
            shininess: 32,
            specularColor: [60, 64, 70]
          },
          wireframe: false
        })
      )
      
      // Earth texture overlay using ESRI satellite imagery
      // Note: This is simplified - in production you'd map the tiles to the sphere
      allLayers.push(
        new SimpleMeshLayer({
          id: 'earth-texture',
          data: [{ position: [0, 0, 0] }],
          mesh: new SphereGeometry({
            radius: EARTH_RADIUS_KM + 1, // Slightly above base sphere
            nlat: 30,
            nlong: 60
          }),
          coordinateSystem: 3,
          getPosition: d => d.position,
          getColor: [100, 150, 100, 100], // Semi-transparent green tint for land
          material: {
            ambient: 0.5,
            diffuse: 0.5
          },
          wireframe: true,
          lineWidthMinPixels: 0.5
        })
      )
    }
    
    // Orbit paths
    if (showOrbits && generatedOrbits.length > 0) {
      generatedOrbits.forEach(orbit => {
        allLayers.push(
          new PathLayer({
            id: orbit.id,
            data: [orbit],
            getPath: d => d.positions.map(p => [p[0], p[1]]),
            getColor: d => d.color,
            getWidth: 2,
            widthMinPixels: 1,
            widthMaxPixels: 3,
            coordinateSystem: 3,
            getDashArray: orbit.satelliteId.startsWith('geo') ? [0, 0] : [8, 4],
            extensions: [],
            parameters: {
              depthTest: false
            }
          })
        )
      })
    }
    
    // Satellites
    if (showSatellites && sampleSatellites.length > 0) {
      allLayers.push(
        new ScatterplotLayer({
          id: 'satellites',
          data: sampleSatellites,
          getPosition: d => [d.position[0], d.position[1]],
          getRadius: d => {
            if (d.type === 'GEO') return 150
            if (d.type === 'MEO') return 100
            return 50
          },
          getFillColor: d => {
            if (d.type === 'GEO') return [255, 200, 0, 255]
            if (d.type === 'MEO') return [0, 255, 150, 255]
            return [100, 200, 255, 255]
          },
          getLineColor: [255, 255, 255, 200],
          lineWidthMinPixels: 2,
          stroked: true,
          filled: true,
          radiusMinPixels: 3,
          radiusMaxPixels: 20,
          coordinateSystem: 3,
          pickable: true,
          parameters: {
            depthTest: false
          }
        })
      )
      
      // Satellite labels
      allLayers.push(
        new TextLayer({
          id: 'satellite-labels',
          data: sampleSatellites,
          getPosition: d => [d.position[0], d.position[1]],
          getText: d => d.name,
          getSize: 12,
          getColor: [255, 255, 255, 255],
          getAngle: 0,
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          coordinateSystem: 3,
          billboard: true,
          sizeScale: 1,
          sizeMinPixels: 8,
          sizeMaxPixels: 16,
          parameters: {
            depthTest: false
          }
        })
      )
    }
    
    // Coverage cones for selected satellites
    if (showCoverage && sampleSatellites.length > 0) {
      const coverageCones = sampleSatellites
        .filter(sat => sat.type === 'GEO' || sat.type === 'MEO')
        .map(sat => {
          const beamWidth = sat.type === 'GEO' ? 10 : 20 // degrees
          const points: [number, number][] = []
          
          for (let i = 0; i <= 36; i++) {
            const angle = (i / 36) * Math.PI * 2
            points.push([
              sat.position[0] + Math.cos(angle) * beamWidth,
              sat.position[1] + Math.sin(angle) * beamWidth
            ])
          }
          
          return {
            id: `coverage-${sat.id}`,
            polygon: points,
            satellite: sat
          }
        })
      
      allLayers.push(
        new PathLayer({
          id: 'coverage-cones',
          data: coverageCones,
          getPath: d => d.polygon,
          getColor: d => {
            if (d.satellite.type === 'GEO') return [255, 200, 0, 50]
            return [0, 255, 150, 50]
          },
          getWidth: 2,
          widthMinPixels: 1,
          coordinateSystem: 3,
          parameters: {
            depthTest: false
          }
        })
      )
    }
    
    return allLayers
  }, [sampleSatellites, generatedOrbits, showOrbits, showSatellites, showCoverage, showEarthTexture])

  return (
    <div className="relative w-full h-full">
      <DeckGL
        views={new GlobeView({ id: 'globe-view' })}
        viewState={viewState || globeViewState}
        onViewStateChange={onViewStateChange || (({ viewState }) => setGlobeViewState(viewState))}
        controller={true}
        layers={layers}
        parameters={{
          clearColor: [0.05, 0.05, 0.1, 1], // Dark space background
          depthTest: true,
          depthFunc: 515 // gl.LEQUAL
        }}
        getTooltip={({ object }) => {
          if (!object) return null
          
          if (object.name && object.type) {
            return {
              html: `
                <div class="bg-black/90 backdrop-blur text-white p-3 rounded-lg text-xs">
                  <div class="font-bold text-sm">${object.name}</div>
                  <div class="text-gray-400 mb-2">${object.operator}</div>
                  <div class="space-y-1">
                    <div>Type: ${object.type}</div>
                    <div>Altitude: ${object.position[2].toLocaleString()} km</div>
                    ${object.constellation ? `<div>Constellation: ${object.constellation}</div>` : ''}
                    <div class="mt-2 pt-2 border-t border-white/20">
                      <div class="text-green-400">Coverage: ${
                        object.type === 'GEO' ? '1/3 of Earth' :
                        object.type === 'MEO' ? 'Regional' : 'Local'
                      }</div>
                      <div class="text-blue-400">Latency: ${
                        object.type === 'GEO' ? '~600ms' :
                        object.type === 'MEO' ? '~150ms' : '~20ms'
                      }</div>
                    </div>
                  </div>
                </div>
              `,
              style: { pointerEvents: 'none' }
            }
          }
          
          return null
        }}
      />
      
      {/* Globe Controls */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-xl rounded-lg p-4 text-white">
        <h3 className="text-sm font-bold mb-3">3D Globe View</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>GEO Satellites (35,786 km)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>MEO Satellites (8,062 km)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span>LEO Satellites (550 km)</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-white/20 text-xs text-gray-400">
          <div>Satellites: {sampleSatellites.length}</div>
          <div>Orbits Tracked: {generatedOrbits.filter(o => !o.satelliteId.startsWith('geo')).length}</div>
        </div>
      </div>
      
      {/* Performance Stats */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur rounded px-3 py-2 text-xs text-white/70">
        <div>Rendering: {sampleSatellites.length} satellites</div>
        <div>Time: {currentTime.toISOString().split('T')[1].split('.')[0]} UTC</div>
      </div>
    </div>
  )
}