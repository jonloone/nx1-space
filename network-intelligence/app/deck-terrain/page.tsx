'use client'

import React, { useState } from 'react'
import { DeckTerrainMap } from '../../components/Map/DeckTerrainMap'

export default function DeckTerrainPage() {
  const [showTerrain, setShowTerrain] = useState(true)
  const [showCoverage, setShowCoverage] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [stationDetails, setStationDetails] = useState<any>(null)

  const handleStationClick = (station: any) => {
    setSelectedStation(station.id)
    setStationDetails(station)
  }

  return (
    <div className="relative w-screen h-screen bg-black">
      {/* Main Map */}
      <DeckTerrainMap
        showTerrain={showTerrain}
        showCoverage={showCoverage}
        showLabels={showLabels}
        selectedStation={selectedStation}
        onStationClick={handleStationClick}
      />

      {/* Controls Panel */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md rounded-lg p-4 space-y-3 min-w-[200px]">
        <h3 className="text-white font-bold text-sm mb-2">Layer Controls</h3>
        
        <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showTerrain}
            onChange={(e) => setShowTerrain(e.target.checked)}
            className="rounded text-cyan-500 focus:ring-cyan-500"
          />
          <span>3D Terrain</span>
        </label>
        
        <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showCoverage}
            onChange={(e) => setShowCoverage(e.target.checked)}
            className="rounded text-cyan-500 focus:ring-cyan-500"
          />
          <span>Coverage Areas</span>
        </label>
        
        <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="rounded text-cyan-500 focus:ring-cyan-500"
          />
          <span>Station Labels</span>
        </label>
      </div>

      {/* Station Details Panel */}
      {stationDetails && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md rounded-lg p-4 min-w-[280px]">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-white font-bold text-lg">{stationDetails.name}</h3>
            <button
              onClick={() => {
                setSelectedStation(null)
                setStationDetails(null)
              }}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Utilization</span>
              <span className="text-white font-medium">{stationDetails.utilization}%</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  stationDetails.utilization > 80 ? 'bg-green-500' :
                  stationDetails.utilization > 60 ? 'bg-blue-500' :
                  stationDetails.utilization > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stationDetails.utilization}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Bandwidth</span>
              <span className="text-white font-medium">{stationDetails.bandwidth}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Satellites</span>
              <span className="text-white font-medium">{stationDetails.satellites}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Coverage Radius</span>
              <span className="text-white font-medium">{stationDetails.coverageRadiusKm} km</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Coordinates</span>
              <span className="text-white font-medium text-xs">
                {stationDetails.position[1].toFixed(4)}°N, {Math.abs(stationDetails.position[0]).toFixed(4)}°W
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md rounded-lg p-3 max-w-md">
        <h3 className="text-cyan-400 font-bold text-sm mb-1">Deck.gl Terrain Visualization</h3>
        <p className="text-gray-300 text-xs">
          Using FREE terrain tiles from AWS and satellite imagery from ESRI. 
          25x smaller than CesiumJS, no asset management needed!
        </p>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-green-400">● High Utilization</span>
          <span className="text-blue-400">● Medium</span>
          <span className="text-yellow-400">● Low</span>
          <span className="text-red-400">● Critical</span>
        </div>
      </div>

      {/* Navigation Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-400">
        <div>🖱️ Left click + drag: Rotate</div>
        <div>🖱️ Right click + drag: Pan</div>
        <div>🖱️ Scroll: Zoom</div>
        <div>💡 Click stations for details</div>
      </div>
    </div>
  )
}