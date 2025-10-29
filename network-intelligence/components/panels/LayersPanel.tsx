/**
 * LayersPanel Component
 *
 * Map layer visibility and style control panel
 * Features:
 * - Base map style selection (Streets, Satellite, Dark, Light)
 * - Data layer toggles (Alerts, Subjects, Locations, etc.)
 * - Opacity controls
 * - Show/hide all functionality
 * - Active layer count
 */

'use client'

import React, { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'
import {
  Layers,
  X,
  Eye,
  EyeOff,
  MapPin,
  AlertTriangle,
  User,
  Building,
  Activity,
  Globe,
  Map
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/lib/stores/mapStore'

export interface LayersPanelProps {
  onClose?: () => void
  onLayerChange?: (layers: LayerState) => void
  className?: string
}

export interface LayerState {
  baseStyle: string
  dataLayers: Record<string, { visible: boolean; opacity: number }>
}

const MAP_STYLES = [
  { id: 'streets', label: 'Streets', icon: Map, desc: 'Default' },
  { id: 'satellite', label: 'Satellite', icon: Globe, desc: 'Imagery' },
  { id: 'dark', label: 'Dark', icon: Activity, desc: 'Low light' },
  { id: 'light', label: 'Light', icon: Eye, desc: 'High contrast' }
]

interface DataLayer {
  id: string
  label: string
  icon: React.ElementType
  description: string
  defaultVisible: boolean
  defaultOpacity: number
  category: 'intelligence' | 'infrastructure' | 'environment'
}

const DATA_LAYERS: DataLayer[] = [
  {
    id: 'alerts',
    label: 'Intelligence Alerts',
    icon: AlertTriangle,
    description: 'Critical alerts and notifications',
    defaultVisible: true,
    defaultOpacity: 100,
    category: 'intelligence'
  },
  {
    id: 'subjects',
    label: 'Subjects',
    icon: User,
    description: 'Tracked individuals and entities',
    defaultVisible: true,
    defaultOpacity: 100,
    category: 'intelligence'
  },
  {
    id: 'locations',
    label: 'Key Locations',
    icon: MapPin,
    description: 'Points of interest',
    defaultVisible: true,
    defaultOpacity: 100,
    category: 'intelligence'
  },
  {
    id: 'buildings',
    label: 'Buildings 3D',
    icon: Building,
    description: '3D building models',
    defaultVisible: false,
    defaultOpacity: 80,
    category: 'infrastructure'
  },
  {
    id: 'networks',
    label: 'Network Connections',
    icon: Activity,
    description: 'Relationship links',
    defaultVisible: false,
    defaultOpacity: 60,
    category: 'intelligence'
  }
]

const LayersPanel = forwardRef<HTMLDivElement, LayersPanelProps>(
  function LayersPanel({ onClose, onLayerChange, className }, ref) {
    const map = useMapStore((state) => state.map)
    const [baseStyle, setBaseStyle] = useState('streets')

    // Initialize layer states
    const initialLayers = DATA_LAYERS.reduce((acc, layer) => {
      acc[layer.id] = {
        visible: layer.defaultVisible,
        opacity: layer.defaultOpacity
      }
      return acc
    }, {} as Record<string, { visible: boolean; opacity: number }>)

    const [dataLayers, setDataLayers] = useState(initialLayers)

    const toggleLayerVisibility = (layerId: string) => {
      const newLayers = {
        ...dataLayers,
        [layerId]: {
          ...dataLayers[layerId],
          visible: !dataLayers[layerId].visible
        }
      }
      setDataLayers(newLayers)
      onLayerChange?.({ baseStyle, dataLayers: newLayers })
    }

    const setLayerOpacity = (layerId: string, opacity: number) => {
      const newLayers = {
        ...dataLayers,
        [layerId]: {
          ...dataLayers[layerId],
          opacity
        }
      }
      setDataLayers(newLayers)
      onLayerChange?.({ baseStyle, dataLayers: newLayers })
    }

    const toggleAll = (visible: boolean) => {
      const newLayers = Object.keys(dataLayers).reduce((acc, key) => {
        acc[key] = {
          ...dataLayers[key],
          visible
        }
        return acc
      }, {} as typeof dataLayers)
      setDataLayers(newLayers)
      onLayerChange?.({ baseStyle, dataLayers: newLayers })
    }

    const handleStyleChange = (styleId: string) => {
      setBaseStyle(styleId)
      onLayerChange?.({ baseStyle: styleId, dataLayers })
      // TODO: Actually change map style when implemented
    }

    const visibleLayerCount = Object.values(dataLayers).filter((l) => l.visible).length
    const groupedLayers = DATA_LAYERS.reduce((acc, layer) => {
      if (!acc[layer.category]) acc[layer.category] = []
      acc[layer.category].push(layer)
      return acc
    }, {} as Record<string, DataLayer[]>)

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn('panel-card w-[340px] flex flex-col', className)}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#176BF8] flex items-center justify-center relative">
              <Layers className="w-4 h-4 text-white" />
              {visibleLayerCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {visibleLayerCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Map Layers
              </h2>
              <p className="text-xs text-[#737373]">
                {visibleLayerCount} of {DATA_LAYERS.length} visible
              </p>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5]"
              aria-label="Close Layers Panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Base Map Style */}
          <div>
            <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide mb-3 block">
              Base Map Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MAP_STYLES.map((style) => {
                const Icon = style.icon
                const isSelected = baseStyle === style.id
                return (
                  <button
                    key={style.id}
                    onClick={() => handleStyleChange(style.id)}
                    className={cn(
                      'h-16 px-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-1',
                      isSelected
                        ? 'bg-[#176BF8] border-[#176BF8] text-white shadow-md'
                        : 'bg-white border-gray-200 hover:bg-[#F5F5F5] text-[#525252]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{style.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(true)}
              className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5]"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAll(false)}
              className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5]"
            >
              <EyeOff className="w-3.5 h-3.5 mr-1.5" />
              Hide All
            </Button>
          </div>

          {/* Data Layers by Category */}
          {Object.entries(groupedLayers).map(([category, layers]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] font-semibold text-[#737373] uppercase tracking-wide">
                  {category}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-3">
                {layers.map((layer) => {
                  const Icon = layer.icon
                  const layerState = dataLayers[layer.id]
                  const isVisible = layerState.visible

                  return (
                    <div
                      key={layer.id}
                      className={cn(
                        'bg-white rounded-lg border p-3 transition-all',
                        isVisible
                          ? 'border-[#176BF8]/30 shadow-sm'
                          : 'border-gray-200'
                      )}
                    >
                      {/* Layer Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2.5 flex-1">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                              isVisible
                                ? 'bg-[#176BF8] text-white'
                                : 'bg-[#F5F5F5] text-[#737373]'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-semibold text-[#171717] leading-tight mb-0.5">
                              {layer.label}
                            </h4>
                            <p className="text-[10px] text-[#737373] leading-relaxed">
                              {layer.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleLayerVisibility(layer.id)}
                          className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5] shrink-0"
                        >
                          {isVisible ? (
                            <Eye className="w-4 h-4 text-[#176BF8]" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-[#737373]" />
                          )}
                        </Button>
                      </div>

                      {/* Opacity Control */}
                      {isVisible && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-semibold text-[#737373] uppercase tracking-wide">
                              Opacity
                            </label>
                            <span className="text-xs font-mono text-[#525252] bg-[#F5F5F5] px-2 py-0.5 rounded">
                              {layerState.opacity}%
                            </span>
                          </div>
                          <Slider
                            value={[layerState.opacity]}
                            onValueChange={(values) =>
                              setLayerOpacity(layer.id, values[0])
                            }
                            min={0}
                            max={100}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Layer Summary */}
          <div className="bg-[#F5F5F5] rounded-lg p-3 border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3.5 h-3.5 text-[#525252]" />
              <span className="text-[10px] font-semibold text-[#171717] uppercase tracking-wide">
                Active Layers
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(dataLayers)
                .filter(([_, state]) => state.visible)
                .map(([layerId]) => {
                  const layer = DATA_LAYERS.find((l) => l.id === layerId)
                  return (
                    <span
                      key={layerId}
                      className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#525252] rounded border border-[#E5E5E5]"
                    >
                      {layer?.label}
                    </span>
                  )
                })}
              {visibleLayerCount === 0 && (
                <span className="text-xs text-[#737373] italic">
                  No layers visible
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
)

export default LayersPanel
