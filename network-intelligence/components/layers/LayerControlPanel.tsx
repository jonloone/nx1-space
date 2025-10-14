'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayerStore } from '@/lib/stores/layerStore'
import {
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Settings,
  X,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'

export default function LayerControlPanel() {
  const {
    layers,
    layerGroups,
    activeLayerIds,
    toggleLayer,
    setLayerOpacity,
    toggleGroupCollapse,
    getLayersInGroup,
    resetLayers
  } = useLayerStore()

  const [isOpen, setIsOpen] = useState(true)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)

  const handleToggleLayer = (layerId: string) => {
    toggleLayer(layerId)
  }

  const handleOpacityChange = (layerId: string, value: number[]) => {
    setLayerOpacity(layerId, value[0] / 100)
  }

  return (
    <div className="fixed left-4 top-4 z-40 w-80">
      {/* Panel Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-t-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Map Layers</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => resetLayers()}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="Reset to default"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Panel Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black/90 backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl overflow-hidden"
          >
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4 space-y-4">
              {/* Layer Groups */}
              {layerGroups.map((group) => {
                const groupLayers = getLayersInGroup(group.id)

                return (
                  <div key={group.id} className="space-y-2">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        {group.collapsed ? (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-300">{group.name}</span>
                        <span className="text-xs text-gray-500">({groupLayers.length})</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {groupLayers.filter(l => l.enabled).length} active
                      </div>
                    </button>

                    {/* Group Layers */}
                    {!group.collapsed && (
                      <div className="ml-6 space-y-2">
                        {groupLayers.map((layer) => (
                          <div key={layer.id} className="space-y-2">
                            {/* Layer Item */}
                            <div className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                              <div className="flex items-center gap-3 flex-1">
                                <button
                                  onClick={() => handleToggleLayer(layer.id)}
                                  className={`transition-colors ${
                                    layer.enabled ? 'text-blue-400' : 'text-gray-500'
                                  }`}
                                >
                                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <div className="flex-1">
                                  <div className="text-sm text-white font-medium">{layer.name}</div>
                                  {layer.metadata?.description && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {layer.metadata.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedLayerId(selectedLayerId === layer.id ? null : layer.id)}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Layer Settings */}
                            {selectedLayerId === layer.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="ml-4 p-3 bg-black/50 border border-white/10 rounded-lg space-y-3"
                              >
                                {/* Opacity Control */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs text-gray-400">Opacity</label>
                                    <span className="text-xs text-white">{Math.round(layer.opacity * 100)}%</span>
                                  </div>
                                  <Slider
                                    value={[layer.opacity * 100]}
                                    onValueChange={(value) => handleOpacityChange(layer.id, value)}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                  />
                                </div>

                                {/* Layer Info */}
                                <div className="pt-2 border-t border-white/10">
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div>Type: <span className="text-gray-400">{layer.type}</span></div>
                                    <div>Source: <span className="text-gray-400">{layer.source}</span></div>
                                    <div>Z-Index: <span className="text-gray-400">{layer.zIndex}</span></div>
                                    {layer.metadata?.dataCount !== undefined && (
                                      <div>Items: <span className="text-gray-400">{layer.metadata.dataCount}</span></div>
                                    )}
                                  </div>
                                </div>

                                {/* Filters */}
                                {layer.filters.length > 0 && (
                                  <div className="pt-2 border-t border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Filter className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-400">Active Filters</span>
                                    </div>
                                    <div className="space-y-1">
                                      {layer.filters.map((filter, idx) => (
                                        <div
                                          key={idx}
                                          className="text-xs px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300"
                                        >
                                          {filter.field} {filter.operator} {String(filter.value)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Stats */}
              <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Layers:</span>
                    <span className="text-white">{layers.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Layers:</span>
                    <span className="text-green-400">{activeLayerIds.size}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
