'use client'

/**
 * Layer Manager
 * Shows all active layers on the map with controls
 * Provides visibility toggles, opacity sliders, and layer removal
 */

import { useState } from 'react'
import { Layers, Eye, EyeOff, Trash2, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { useSpaceStore } from '@/lib/stores/spaceStore'
import { useSatelliteTrackingStore } from '@/lib/stores/satelliteTrackingStore'

interface LayerManagerProps {
  className?: string
}

interface LayerItem {
  id: string
  name: string
  type: 'imagery' | 'track' | 'infrastructure' | 'basemap'
  visible: boolean
  opacity?: number
  icon: string
}

export function LayerManager({ className = '' }: LayerManagerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { images, selectedImage, imageOpacity, setImageOpacity } = useSpaceStore()
  const { satellites } = useSatelliteTrackingStore()

  // Build layer list from current state
  const layers: LayerItem[] = []

  // Add imagery layer if loaded
  if (selectedImage && images.length > 0) {
    layers.push({
      id: 'imagery-sentinel2',
      name: `Sentinel-2 (${selectedImage.acquisitionDate.toLocaleDateString()})`,
      type: 'imagery',
      visible: true,
      opacity: imageOpacity,
      icon: '📸'
    })
  }

  // Add satellite ground tracks
  satellites.forEach(sat => {
    layers.push({
      id: `track-${sat.catalogNumber}`,
      name: `${sat.name} Ground Track`,
      type: 'track',
      visible: true,
      icon: '🛰️'
    })
  })

  // Add infrastructure layers (static for now)
  layers.push({
    id: 'infrastructure-buildings',
    name: 'Buildings',
    type: 'infrastructure',
    visible: false, // Default off
    icon: '🏢'
  })

  layers.push({
    id: 'infrastructure-roads',
    name: 'Roads',
    type: 'infrastructure',
    visible: true,
    icon: '🛣️'
  })

  layers.push({
    id: 'infrastructure-places',
    name: 'Places',
    type: 'infrastructure',
    visible: true,
    icon: '📍'
  })

  // Add basemap
  layers.push({
    id: 'basemap',
    name: 'Base Map',
    type: 'basemap',
    visible: true,
    icon: '🗺️'
  })

  if (!isExpanded) {
    return (
      <div className={`bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Layers ({layers.length})</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-white">Layers</span>
          <span className="text-xs text-gray-500">({layers.length})</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          title="Minimize"
        >
          <ChevronUp className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Layer List */}
      <div className="max-h-96 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No layers active</p>
            <p className="text-xs mt-1">Add imagery or satellite tracks</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {/* Imagery Group */}
            {layers.some(l => l.type === 'imagery') && (
              <div className="p-3">
                <div className="text-xs font-medium text-gray-500 mb-2">IMAGERY</div>
                {layers.filter(l => l.type === 'imagery').map(layer => (
                  <LayerItemComponent
                    key={layer.id}
                    layer={layer}
                    onToggleVisibility={() => {}}
                    onOpacityChange={(opacity) => setImageOpacity(opacity)}
                    onRemove={() => {}}
                  />
                ))}
              </div>
            )}

            {/* Satellite Tracks Group */}
            {layers.some(l => l.type === 'track') && (
              <div className="p-3">
                <div className="text-xs font-medium text-gray-500 mb-2">SATELLITE TRACKS</div>
                {layers.filter(l => l.type === 'track').map(layer => (
                  <LayerItemComponent
                    key={layer.id}
                    layer={layer}
                    onToggleVisibility={() => {}}
                    onOpacityChange={() => {}}
                    onRemove={() => {}}
                  />
                ))}
              </div>
            )}

            {/* Infrastructure Group */}
            {layers.some(l => l.type === 'infrastructure') && (
              <div className="p-3">
                <div className="text-xs font-medium text-gray-500 mb-2">INFRASTRUCTURE</div>
                {layers.filter(l => l.type === 'infrastructure').map(layer => (
                  <LayerItemComponent
                    key={layer.id}
                    layer={layer}
                    onToggleVisibility={() => {}}
                    onOpacityChange={() => {}}
                    onRemove={() => {}}
                  />
                ))}
              </div>
            )}

            {/* Base Map */}
            {layers.some(l => l.type === 'basemap') && (
              <div className="p-3">
                <div className="text-xs font-medium text-gray-500 mb-2">BASE MAP</div>
                {layers.filter(l => l.type === 'basemap').map(layer => (
                  <LayerItemComponent
                    key={layer.id}
                    layer={layer}
                    onToggleVisibility={() => {}}
                    onOpacityChange={() => {}}
                    onRemove={() => {}}
                    hideRemove
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Layer Item Component
interface LayerItemComponentProps {
  layer: LayerItem
  onToggleVisibility: () => void
  onOpacityChange: (opacity: number) => void
  onRemove: () => void
  hideRemove?: boolean
}

function LayerItemComponent({
  layer,
  onToggleVisibility,
  onOpacityChange,
  onRemove,
  hideRemove = false
}: LayerItemComponentProps) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base">{layer.icon}</span>
          <span className="text-sm text-gray-300 truncate">{layer.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleVisibility}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors"
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible ? (
              <Eye className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-600" />
            )}
          </button>
          {!hideRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 hover:bg-gray-800 rounded transition-colors"
              title="Remove layer"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Opacity Slider (for imagery) */}
      {layer.opacity !== undefined && layer.visible && (
        <div className="flex items-center gap-2 mt-1 ml-6">
          <span className="text-xs text-gray-500">Opacity:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={layer.opacity * 100}
            onChange={(e) => onOpacityChange(parseInt(e.target.value) / 100)}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-gray-400 w-8 text-right">
            {Math.round(layer.opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}
