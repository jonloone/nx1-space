'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Check,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LAYER_CATALOG,
  LAYER_CATEGORIES,
  getLayersByCategory,
  getAvailableLayers,
  searchLayers,
  type LayerDefinition,
  type LayerCategory
} from '@/lib/config/layerCatalog'
import { cn } from '@/lib/utils'

interface AddLayerDropdownProps {
  open: boolean
  onClose: () => void
  onAddLayer: (layerId: string) => void
  addedLayerIds: string[] // Already added layers
}

export default function AddLayerDropdown({
  open,
  onClose,
  onAddLayer,
  addedLayerIds
}: AddLayerDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<LayerCategory>>(new Set(['basemaps', 'infrastructure']))

  // Filter layers based on search query (only available layers)
  const filteredResults = useMemo(() => {
    if (searchQuery.trim()) {
      return searchLayers(searchQuery).filter(layer => layer.status === 'available')
    }
    return []
  }, [searchQuery])

  const toggleCategory = (categoryId: LayerCategory) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleAddLayer = (layerId: string) => {
    onAddLayer(layerId)
    // Don't close so user can add multiple layers
  }

  const isLayerAdded = (layerId: string) => {
    return addedLayerIds.includes(layerId)
  }

  // Close on click outside
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const dropdown = document.getElementById('add-layer-dropdown')
      if (dropdown && !dropdown.contains(target)) {
        onClose()
      }
    }

    // Delay to avoid immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="add-layer-dropdown"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-[140px] left-6 w-[420px] z-[60]"
        >
          <div className="bg-white border border-border rounded-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="text-sm font-semibold text-foreground">Add Layer</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-6 w-6 rounded-md"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="px-4 py-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search layers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                    autoFocus
                  />
                </div>
              </div>

              {/* Content */}
              <ScrollArea className="h-[500px]">
                {searchQuery ? (
                  // Search Results
                  <div className="p-2">
                    {filteredResults.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No layers found
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredResults.map((layer) => (
                          <LayerItem
                            key={layer.id}
                            layer={layer}
                            isAdded={isLayerAdded(layer.id)}
                            onAdd={() => handleAddLayer(layer.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Category View
                  <div className="p-2">
                    {Object.values(LAYER_CATEGORIES)
                      .sort((a, b) => a.order - b.order)
                      .map((category) => {
                        const layers = getLayersByCategory(category.id).filter(l => l.status === 'available')
                        if (layers.length === 0) return null // Skip empty categories
                        const isExpanded = expandedCategories.has(category.id)
                        const addedCount = layers.filter(l => isLayerAdded(l.id)).length

                        return (
                          <div key={category.id} className="mb-2">
                            {/* Category Header */}
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="text-lg shrink-0">{category.icon}</span>
                              <span className="text-sm font-medium text-foreground flex-1 text-left">
                                {category.name}
                              </span>
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {addedCount}/{layers.length}
                              </Badge>
                            </button>

                            {/* Category Layers */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-6 mt-1 space-y-1">
                                    {layers.map((layer) => (
                                      <LayerItem
                                        key={layer.id}
                                        layer={layer}
                                        isAdded={isLayerAdded(layer.id)}
                                        onAdd={() => handleAddLayer(layer.id)}
                                      />
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {addedLayerIds.length} {addedLayerIds.length === 1 ? 'layer' : 'layers'} added
                </span>
                <Button onClick={onClose} size="sm" variant="outline">
                  Done
                </Button>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Layer Item Component
 */
interface LayerItemProps {
  layer: LayerDefinition
  isAdded: boolean
  onAdd: () => void
}

function LayerItem({ layer, isAdded, onAdd }: LayerItemProps) {
  const canAdd = !isAdded

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
        isAdded
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-muted border border-transparent'
      )}
    >
      {/* Icon */}
      <span className="text-base shrink-0">{layer.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {layer.name}
          </span>
          {isAdded && (
            <Check className="h-3 w-3 text-blue-600 shrink-0" />
          )}
        </div>
        {layer.coverage && (
          <div className="mt-0.5">
            <span className="text-[10px] text-muted-foreground">
              {layer.coverage}
            </span>
          </div>
        )}
      </div>

      {/* Add Button */}
      {canAdd && (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="h-7 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          Add
        </Button>
      )}
    </div>
  )
}
