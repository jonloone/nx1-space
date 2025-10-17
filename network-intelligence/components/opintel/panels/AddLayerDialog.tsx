'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Check,
  Info,
  Globe,
  Clock,
  Layers,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  LAYER_CATALOG,
  LAYER_CATEGORIES,
  getLayersByCategory,
  searchLayers,
  type LayerDefinition,
  type LayerCategory
} from '@/lib/config/layerCatalog'
import { cn } from '@/lib/utils'

interface AddLayerDialogProps {
  open: boolean
  onClose: () => void
  onAddLayer: (layerId: string) => void
  addedLayerIds: string[] // Already added layers
}

export default function AddLayerDialog({
  open,
  onClose,
  onAddLayer,
  addedLayerIds
}: AddLayerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<LayerCategory>('basemaps')
  const [selectedLayer, setSelectedLayer] = useState<LayerDefinition | null>(null)

  // Filter layers based on search query
  const filteredLayers = useMemo(() => {
    if (searchQuery.trim()) {
      return searchLayers(searchQuery)
    }
    return getLayersByCategory(selectedCategory)
  }, [searchQuery, selectedCategory])

  const handleAddLayer = (layerId: string) => {
    onAddLayer(layerId)
    setSelectedLayer(null)
    // Don't close dialog so user can add multiple layers
  }

  const isLayerAdded = (layerId: string) => {
    return addedLayerIds.includes(layerId)
  }

  const getStatusBadgeVariant = (status: LayerDefinition['status']) => {
    switch (status) {
      case 'available':
        return 'default'
      case 'coming-soon':
        return 'secondary'
      case 'requires-setup':
        return 'outline'
    }
  }

  const getStatusText = (status: LayerDefinition['status']) => {
    switch (status) {
      case 'available':
        return 'Available'
      case 'coming-soon':
        return 'Coming Soon'
      case 'requires-setup':
        return 'Requires Setup'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Add Layer</DialogTitle>
          <DialogDescription>
            Browse and add layers to your map for enhanced visualization
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search layers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Separator />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {!searchQuery ? (
            // Category Tabs View
            <Tabs
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as LayerCategory)}
              className="flex-1 flex flex-col"
            >
              {/* Category Tabs */}
              <div className="px-6">
                <TabsList className="grid grid-cols-7 w-full">
                  {Object.values(LAYER_CATEGORIES)
                    .sort((a, b) => a.order - b.order)
                    .map((category) => (
                      <TabsTrigger key={category.id} value={category.id} className="text-[10px] px-1">
                        <span className="mr-0.5">{category.icon}</span>
                        <span className="hidden 2xl:inline text-[10px]">{category.name.split(' ')[0]}</span>
                      </TabsTrigger>
                    ))}
                </TabsList>
              </div>

              {/* Layer Grid for each category */}
              {Object.values(LAYER_CATEGORIES).map((category) => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="flex-1 m-0 mt-4"
                >
                  <ScrollArea className="h-full px-6">
                    <div className="pb-6">
                      {/* Category Description */}
                      <p className="text-sm text-muted-foreground mb-4">
                        {category.description}
                      </p>

                      {/* Layer Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getLayersByCategory(category.id).map((layer) => (
                          <LayerCard
                            key={layer.id}
                            layer={layer}
                            isAdded={isLayerAdded(layer.id)}
                            onAdd={() => handleAddLayer(layer.id)}
                            onSelect={() => setSelectedLayer(layer)}
                          />
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // Search Results View
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 px-6">
                <div className="pb-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    {filteredLayers.length} {filteredLayers.length === 1 ? 'result' : 'results'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredLayers.map((layer) => (
                      <LayerCard
                        key={layer.id}
                        layer={layer}
                        isAdded={isLayerAdded(layer.id)}
                        onAdd={() => handleAddLayer(layer.id)}
                        onSelect={() => setSelectedLayer(layer)}
                      />
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end">
          <Button onClick={onClose} variant="outline">
            Done
          </Button>
        </div>

        {/* Layer Details Panel (slides in from right) */}
        <AnimatePresence>
          {selectedLayer && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 right-0 w-80 bg-background border-l shadow-lg"
            >
              <LayerDetailsPanel
                layer={selectedLayer}
                isAdded={isLayerAdded(selectedLayer.id)}
                onAdd={() => handleAddLayer(selectedLayer.id)}
                onClose={() => setSelectedLayer(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Layer Card Component
 */
interface LayerCardProps {
  layer: LayerDefinition
  isAdded: boolean
  onAdd: () => void
  onSelect: () => void
}

function LayerCard({ layer, isAdded, onAdd, onSelect }: LayerCardProps) {
  const canAdd = layer.status === 'available' && !isAdded

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-lg border transition-all cursor-pointer',
        isAdded
          ? 'bg-blue-50 border-blue-200'
          : 'bg-white hover:shadow-md hover:border-gray-300'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="text-2xl shrink-0">{layer.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{layer.name}</h4>
            {isAdded && (
              <Check className="h-4 w-4 text-blue-600 shrink-0" />
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {layer.description}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getStatusBadgeVariant(layer.status)} className="text-[10px]">
              {getStatusText(layer.status)}
            </Badge>

            {layer.coverage && (
              <Badge variant="outline" className="text-[10px]">
                {layer.coverage}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Add Button */}
      {canAdd && (
        <Button
          size="sm"
          className="w-full mt-3"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
        >
          Add to Map
        </Button>
      )}

      {!canAdd && !isAdded && (
        <Button
          size="sm"
          className="w-full mt-3"
          variant="outline"
          disabled
        >
          {layer.status === 'coming-soon' ? 'Coming Soon' : 'Requires Setup'}
        </Button>
      )}
    </motion.div>
  )
}

function getStatusBadgeVariant(status: LayerDefinition['status']) {
  switch (status) {
    case 'available':
      return 'default' as const
    case 'coming-soon':
      return 'secondary' as const
    case 'requires-setup':
      return 'outline' as const
  }
}

function getStatusText(status: LayerDefinition['status']) {
  switch (status) {
    case 'available':
      return 'Available'
    case 'coming-soon':
      return 'Coming Soon'
    case 'requires-setup':
      return 'Requires Setup'
  }
}

/**
 * Layer Details Panel
 */
interface LayerDetailsPanelProps {
  layer: LayerDefinition
  isAdded: boolean
  onAdd: () => void
  onClose: () => void
}

function LayerDetailsPanel({ layer, isAdded, onAdd, onClose }: LayerDetailsPanelProps) {
  const canAdd = layer.status === 'available' && !isAdded

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{layer.icon}</div>
            <div>
              <h3 className="font-semibold">{layer.name}</h3>
              <p className="text-xs text-muted-foreground">
                {LAYER_CATEGORIES[layer.category].name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{layer.description}</p>

        {/* Add Button */}
        {canAdd && (
          <Button className="w-full" onClick={onAdd}>
            Add to Map
          </Button>
        )}

        {isAdded && (
          <Button className="w-full" variant="outline" disabled>
            <Check className="h-4 w-4 mr-2" />
            Added
          </Button>
        )}

        {!canAdd && !isAdded && (
          <Button className="w-full" variant="outline" disabled>
            {layer.status === 'coming-soon' ? 'Coming Soon' : 'Requires Setup'}
          </Button>
        )}
      </div>

      {/* Details */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {/* Status */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Status</h4>
            <Badge variant={getStatusBadgeVariant(layer.status)}>
              {getStatusText(layer.status)}
            </Badge>
          </div>

          {/* Data Source */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Data Source</h4>
            <p className="text-sm">{layer.dataSource}</p>
          </div>

          {/* Coverage */}
          {layer.coverage && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Coverage
              </h4>
              <p className="text-sm capitalize">{layer.coverage}</p>
            </div>
          )}

          {/* Update Frequency */}
          {layer.updateFrequency && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Update Frequency
              </h4>
              <p className="text-sm capitalize">{layer.updateFrequency}</p>
            </div>
          )}

          {/* Resolution */}
          {layer.resolution && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Resolution
              </h4>
              <p className="text-sm">{layer.resolution}</p>
            </div>
          )}

          <Separator />

          {/* Technical Details */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Technical Details</h4>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Layer Type:</dt>
                <dd className="font-medium">{layer.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Zoom Range:</dt>
                <dd className="font-medium">{layer.minZoom} - {layer.maxZoom}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Requires API Key:</dt>
                <dd className="font-medium">{layer.requiresApiKey ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>

          {/* Documentation Link */}
          {layer.documentation && (
            <div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open(layer.documentation, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View Documentation
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
