/**
 * Layer Control Panel
 * Quick toggles for analysis layers
 *
 * Features:
 * - Enable/disable analysis layers
 * - Layer opacity controls
 * - Quick presets
 * - Layer status indicators
 */

'use client'

import React, { useState } from 'react'
import { Layers, Route, Satellite, Target, Eye, EyeOff, Sliders } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface LayerConfig {
  id: string
  type: 'route' | 'imagery' | 'isochrone' | 'changes' | 'objects'
  label: string
  enabled: boolean
  opacity: number
  icon?: React.ReactNode
  color?: string
}

export interface LayerControlPanelProps {
  layers: LayerConfig[]
  onLayerToggle: (layerId: string, enabled: boolean) => void
  onOpacityChange: (layerId: string, opacity: number) => void
  onPresetApply?: (presetId: string) => void
  compact?: boolean
}

const PRESETS = [
  {
    id: 'operational',
    label: 'Operational',
    description: 'Route + Reachability',
    emoji: '🎯',
    layers: ['route', 'isochrone']
  },
  {
    id: 'surveillance',
    label: 'Surveillance',
    description: 'Imagery + Changes',
    emoji: '🛰️',
    layers: ['imagery', 'changes', 'objects']
  },
  {
    id: 'strategic',
    label: 'Strategic',
    description: 'All Layers',
    emoji: '🎖️',
    layers: ['route', 'imagery', 'isochrone', 'changes', 'objects']
  }
]

export default function LayerControlPanel({
  layers,
  onLayerToggle,
  onOpacityChange,
  onPresetApply,
  compact = false
}: LayerControlPanelProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())
  const [showPresets, setShowPresets] = useState(true)

  const toggleLayerExpanded = (layerId: string) => {
    const newExpanded = new Set(expandedLayers)
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId)
    } else {
      newExpanded.add(layerId)
    }
    setExpandedLayers(newExpanded)
  }

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'route':
        return <Route className="h-4 w-4" />
      case 'imagery':
        return <Satellite className="h-4 w-4" />
      case 'isochrone':
        return <Target className="h-4 w-4" />
      case 'changes':
        return <Layers className="h-4 w-4" />
      case 'objects':
        return <Eye className="h-4 w-4" />
      default:
        return <Layers className="h-4 w-4" />
    }
  }

  const enabledCount = layers.filter(l => l.enabled).length

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Layers ({enabledCount}/{layers.length})
          </h3>
        </div>

        <div className="space-y-2">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onLayerToggle(layer.id, !layer.enabled)}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded transition-colors',
                layer.enabled ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              )}
            >
              <div className="flex items-center gap-2">
                {layer.icon || getLayerIcon(layer.type)}
                <span className="text-sm font-medium">{layer.label}</span>
              </div>
              {layer.enabled ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Layer Control
          </h2>
          <div className="text-sm text-gray-600">
            {enabledCount}/{layers.length} active
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-5 space-y-6">
          {/* Quick Presets */}
          {showPresets && onPresetApply && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Presets</h3>
              <div className="grid grid-cols-1 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onPresetApply(preset.id)}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <span className="text-2xl">{preset.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{preset.label}</div>
                      <div className="text-xs text-gray-600">{preset.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layer Controls */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Layers</h3>
            <div className="space-y-3">
              {layers.map((layer) => {
                const isExpanded = expandedLayers.has(layer.id)

                return (
                  <div
                    key={layer.id}
                    className={cn(
                      'border rounded-lg overflow-hidden transition-all',
                      layer.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                    )}
                  >
                    {/* Layer Header */}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onLayerToggle(layer.id, !layer.enabled)}
                            className={cn(
                              'w-10 h-6 rounded-full transition-colors relative',
                              layer.enabled ? 'bg-blue-600' : 'bg-gray-300'
                            )}
                          >
                            <div
                              className={cn(
                                'w-4 h-4 rounded-full bg-white absolute top-1 transition-transform',
                                layer.enabled ? 'translate-x-5' : 'translate-x-1'
                              )}
                            />
                          </button>

                          <div className="flex items-center gap-2">
                            {layer.icon || getLayerIcon(layer.type)}
                            <span className="text-sm font-medium text-gray-900">{layer.label}</span>
                          </div>
                        </div>

                        {layer.enabled && (
                          <button
                            onClick={() => toggleLayerExpanded(layer.id)}
                            className="p-1 hover:bg-white rounded transition-colors"
                          >
                            <Sliders className="h-4 w-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Opacity Control */}
                    {layer.enabled && isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-200 pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">Opacity</span>
                          <span className="text-xs font-semibold text-gray-900">
                            {Math.round(layer.opacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={layer.opacity * 100}
                          onChange={(e) => onOpacityChange(layer.id, parseInt(e.target.value) / 100)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Layer Legend */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Layer Types</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <Route className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Route Analysis</div>
                  <div>Intelligence-grade route with multi-INT waypoint assessment</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Satellite className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Satellite Imagery</div>
                  <div>Base imagery from Sentinel-2 or Mapbox</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Isochrone / Reachability</div>
                  <div>Travel time zones showing accessible areas</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Change Detection</div>
                  <div>Detected changes from satellite imagery analysis</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">Object Detection</div>
                  <div>Detected objects (buildings, vehicles, etc.)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Controls */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => layers.forEach(l => onLayerToggle(l.id, true))}
                className="flex-1"
              >
                Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => layers.forEach(l => onLayerToggle(l.id, false))}
                className="flex-1"
              >
                Disable All
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
