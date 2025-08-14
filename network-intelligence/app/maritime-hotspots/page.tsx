'use client'

import React, { useState } from 'react'
import { HybridGlobeMap } from '../../components/Map/HybridGlobeMap'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { ArrowLeft, Ship, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function MaritimeHotspotsPage() {
  const [showMaritimeHotspots, setShowMaritimeHotspots] = useState(true)
  const [showTerrain, setShowTerrain] = useState(true)
  const [showCoverage, setShowCoverage] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-black p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-red-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Maritime Hotspot Detection</h1>
                  <p className="text-gray-400 text-sm">Statistical Analysis of Maritime Traffic Patterns</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-red-400 border-red-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Hot Spots Detected
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                Getis-Ord Gi* Analysis
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-[calc(100vh-120px)]">
        {/* Map Container */}
        <div className="absolute inset-0">
          <HybridGlobeMap
            activeTab="operations"
            showTerrain={showTerrain}
            showCoverage={showCoverage}
            showLabels={showLabels}
            showSatellites={showSatellites}
            showMaritimeHotspots={showMaritimeHotspots}
            selectedStation={selectedStation}
            onStationClick={(station) => setSelectedStation(station.id)}
          />
        </div>

        {/* Control Panel */}
        <div className="absolute top-4 left-4 z-10 w-80">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4">
            <h3 className="text-white font-semibold mb-3">Maritime Hotspot Controls</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Maritime Hotspots</span>
                <Button
                  variant={showMaritimeHotspots ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMaritimeHotspots(!showMaritimeHotspots)}
                >
                  {showMaritimeHotspots ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Terrain</span>
                <Button
                  variant={showTerrain ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowTerrain(!showTerrain)}
                >
                  {showTerrain ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Station Coverage</span>
                <Button
                  variant={showCoverage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCoverage(!showCoverage)}
                >
                  {showCoverage ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Labels</span>
                <Button
                  variant={showLabels ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowLabels(!showLabels)}
                >
                  {showLabels ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Satellites</span>
                <Button
                  variant={showSatellites ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowSatellites(!showSatellites)}
                >
                  {showSatellites ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-2">Hotspot Legend</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-300">Hot Spots (High Traffic)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-300">Cold Spots (Low Traffic)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  <span className="text-gray-300">Growing Trend</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📉</span>
                  <span className="text-gray-300">Declining Trend</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">➡️</span>
                  <span className="text-gray-300">Stable Trend</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Information Panel */}
        <div className="absolute top-4 right-4 z-10 w-80">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-4">
            <h3 className="text-white font-semibold mb-3">Hotspot Analysis Info</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                <strong className="text-white">Algorithm:</strong> Getis-Ord Gi* Statistical Analysis
              </p>
              <p>
                <strong className="text-white">Confidence Threshold:</strong> 95% (Z-score ≥ 1.96)
              </p>
              <p>
                <strong className="text-white">Spatial Distance:</strong> 100 km weighting threshold
              </p>
              <p>
                <strong className="text-white">Data Points:</strong> Maritime vessel traffic density
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-2">Key Maritime Routes</h4>
              <div className="text-xs text-gray-300 space-y-1">
                <div>• Singapore Strait (Major chokepoint)</div>
                <div>• Suez Canal (Critical route)</div>
                <div>• Panama Canal (Transit hub)</div>
                <div>• English Channel (High density)</div>
                <div>• Strait of Hormuz (Oil shipping)</div>
                <div>• Major container ports worldwide</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Help Text */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm p-3">
            <div className="text-xs text-gray-400 text-center">
              Hover over hotspots to see statistical details • Click to select • Use mouse wheel to zoom
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}