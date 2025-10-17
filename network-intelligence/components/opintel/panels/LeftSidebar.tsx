'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Database,
  Layers,
  Radio,
  Plus,
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Circle,
  GripVertical,
  FileJson,
  Table,
  Link as LinkIcon,
  Play,
  Pause,
  SkipBack,
  Trash2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import PlacesLayerControl from './PlacesLayerControl'
import { getAvailableLayers, type LayerDefinition } from '@/lib/config/layerCatalog'
import {
  LAYER_PRESETS,
  getAvailablePresets,
  getComingSoonPresets,
  type LayerPreset
} from '@/lib/config/layerPresets'

interface DataSource {
  id: string
  name: string
  type: 'file' | 'api' | 'database' | 'stream'
  status: 'connected' | 'disconnected' | 'loading'
  lastUpdated?: string
  recordCount?: number
}

interface Layer {
  id: string
  name: string
  type: string
  visible: boolean
  opacity: number
  color?: string
  icon?: string
}

interface LiveStream {
  id: string
  name: string
  status: 'active' | 'paused' | 'error'
  messagesPerSecond: number
  totalMessages: number
  latency: number
}

interface LeftSidebarProps {
  dataSources?: DataSource[]
  layers?: Layer[] // Active layers with visibility state
  liveStreams?: LiveStream[]
  onAddDataSource?: () => void
  onAddLayer?: (layerId: string) => void // Modified to pass layerId
  onToggleLayer?: (layerId: string) => void
  onRemoveLayer?: (layerId: string) => void
  onChangeOpacity?: (layerId: string, opacity: number) => void
  onLayerSettings?: (layerId: string) => void
  onStreamToggle?: (streamId: string) => void
  onTogglePlaceCategory?: (categoryId: string) => void
  onTogglePlaceGroup?: (groupId: string, enabled: boolean) => void
  onLoadPreset?: (presetId: string) => void // New: Load layer preset
}

export default function LeftSidebar({
  dataSources = [],
  layers = [],
  liveStreams = [],
  onAddDataSource,
  onAddLayer,
  onToggleLayer,
  onRemoveLayer,
  onChangeOpacity,
  onLayerSettings,
  onStreamToggle,
  onTogglePlaceCategory,
  onTogglePlaceGroup,
  onLoadPreset
}: LeftSidebarProps) {
  // Track which layers are expanded (user can manually expand/collapse)
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())

  // Get all available layers from catalog
  const availableLayers = getAvailableLayers()

  // Check if a layer is active (added to map)
  const isLayerActive = (layerId: string) => {
    return layers.some(l => l.id === layerId)
  }

  // Get layer visibility state
  const getLayerVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    return layer?.visible ?? false
  }

  // Get layer opacity
  const getLayerOpacity = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    return layer?.opacity ?? 1.0
  }

  const toggleLayerExpanded = (layerId: string) => {
    const newExpanded = new Set(expandedLayers)
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId)
    } else {
      newExpanded.add(layerId)
    }
    setExpandedLayers(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'bg-[#22C55E]' // Success green (WCAG compliant)
      case 'disconnected':
      case 'error':
        return 'bg-[#EF4444]' // Error red (WCAG compliant)
      case 'loading':
      case 'paused':
        return 'bg-[#F59E0B]' // Warning amber (WCAG compliant)
      default:
        return 'bg-[#A3A3A3]' // Neutral gray
    }
  }

  const getDataSourceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileJson className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'api':
        return <LinkIcon className="h-4 w-4" />
      case 'stream':
        return <Radio className="h-4 w-4" />
      default:
        return <Table className="h-4 w-4" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="layers" className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="px-4 pt-4 pb-3">
          <TabsList className="grid w-full grid-cols-2 bg-muted border border-border">
            <TabsTrigger value="layers" className="text-xs text-muted-foreground data-[state=active]:text-foreground">
              <Layers className="h-3 w-3 mr-1" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs text-muted-foreground data-[state=active]:text-foreground">
              <Database className="h-3 w-3 mr-1" />
              Data
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Data Sources Tab */}
        <TabsContent value="data" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="px-4 pb-4 space-y-3">
              {/* Add Data Source Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs border-border bg-white hover:bg-muted text-foreground rounded-mundi-md"
                onClick={onAddDataSource}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Data Source
              </Button>

              <Separator className="bg-border" />

              {/* Data Sources List */}
              {dataSources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No data sources connected
                </div>
              ) : (
                <div className="space-y-2">
                  {dataSources.map((source) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-mundi-lg border border-border bg-white hover:shadow-mundi-sm cursor-pointer transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-muted-foreground">
                          {getDataSourceIcon(source.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground truncate">
                              {source.name}
                            </span>
                            <div
                              className={cn(
                                'w-1.5 h-1.5 rounded-full shrink-0',
                                getStatusColor(source.status)
                              )}
                            />
                          </div>
                          {source.recordCount !== undefined && (
                            <div className="text-[10px] text-muted-foreground">
                              {source.recordCount.toLocaleString()} records
                            </div>
                          )}
                          {source.lastUpdated && (
                            <div className="text-[10px] text-muted-foreground">
                              Updated {source.lastUpdated}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 hover:bg-muted rounded-mundi-md text-foreground"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-mundi-lg">
                            <DropdownMenuItem>Refresh</DropdownMenuItem>
                            <DropdownMenuItem>Configure</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Layers Tab */}
        <TabsContent value="layers" className="flex-1 m-0 data-[state=inactive]:hidden overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="px-4 pb-4 space-y-3">
              {/* Use Case Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Use Cases
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {getAvailablePresets().length} available
                  </span>
                </div>

                {/* Available Presets */}
                <div className="space-y-1.5">
                  {getAvailablePresets().map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => onLoadPreset?.(preset.id)}
                      className="w-full flex items-start gap-2 p-2.5 rounded-mundi-md hover:bg-muted border border-transparent hover:border-border transition-all group"
                    >
                      <span className="text-lg shrink-0 mt-0.5">{preset.icon}</span>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Coming Soon Presets */}
                {getComingSoonPresets().length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                        Coming Soon
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-1.5">
                      {getComingSoonPresets().map((preset) => (
                        <div
                          key={preset.id}
                          className="w-full flex items-start gap-2 p-2.5 rounded-mundi-md bg-muted/30 opacity-60 cursor-not-allowed"
                        >
                          <span className="text-lg shrink-0 mt-0.5 grayscale">{preset.icon}</span>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-foreground truncate">
                                {preset.name}
                              </span>
                              <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                                {preset.developmentPriority === 'high' ? 'Q1 2025' :
                                 preset.developmentPriority === 'medium' ? 'Q2 2025' : 'Q3 2025'}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                              {preset.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Separator className="bg-border" />

              {/* Basemaps Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Basemaps (6)
                </span>
                <div className="space-y-1">
                  {availableLayers
                    .filter(layer => layer.category === 'basemaps')
                    .map((layerDef) => (
                      <div
                        key={layerDef.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-mundi-md hover:bg-muted transition-colors"
                      >
                        <span className="text-sm">{layerDef.icon}</span>
                        <span className="text-xs font-medium flex-1">{layerDef.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => {
                            if (!isLayerActive(layerDef.id)) {
                              onAddLayer?.(layerDef.id)
                            }
                          }}
                        >
                          {isLayerActive(layerDef.id) ? 'Active' : 'Load'}
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Infrastructure Layers Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Infrastructure (3)
                </span>
                <div className="space-y-2">
                  {availableLayers
                    .filter(layer => layer.category === 'infrastructure')
                    .map((layerDef) => {
                      const isActive = isLayerActive(layerDef.id)
                      const isVisible = getLayerVisibility(layerDef.id)
                      const opacity = getLayerOpacity(layerDef.id)

                      return (
                        <motion.div
                          key={layerDef.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-mundi-lg border border-border bg-white hover:shadow-mundi-sm transition-all"
                        >
                          {/* Layer Header */}
                          <div className="flex items-center gap-2 p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 shrink-0 hover:bg-muted rounded-mundi-md text-foreground"
                              onClick={() => toggleLayerExpanded(layerDef.id)}
                            >
                              {expandedLayers.has(layerDef.id) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>

                            <span className="text-sm">{layerDef.icon}</span>

                            <span className="text-xs font-medium text-foreground flex-1 truncate">
                              {layerDef.name}
                            </span>

                            {!isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => onAddLayer?.(layerDef.id)}
                              >
                                Load
                              </Button>
                            ) : (
                              <Switch
                                checked={isVisible}
                                onCheckedChange={() => onToggleLayer?.(layerDef.id)}
                                className="shrink-0 scale-75"
                              />
                            )}
                          </div>

                          {/* Expanded Layer Details */}
                          {expandedLayers.has(layerDef.id) && isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-3 space-y-3 border-t border-border"
                            >
                              {layerDef.id === 'infra-places' ? (
                                // Simplified category group controls for Places layer
                                <div className="pt-2">
                                  <PlacesLayerControl
                                    onToggleGroup={onTogglePlaceGroup}
                                    visibleCounts={new Map()}
                                  />
                                </div>
                              ) : (
                                // Standard layer controls for other layers
                                <>
                                  <div className="text-[10px] text-muted-foreground pt-2">
                                    {layerDef.coverage} • {layerDef.type}
                                  </div>

                                  {/* Opacity Slider */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">Opacity</span>
                                      <span className="text-xs text-muted-foreground font-medium">
                                        {Math.round(opacity * 100)}%
                                      </span>
                                    </div>
                                    <Slider
                                      value={[opacity * 100]}
                                      onValueChange={(value) => {
                                        onChangeOpacity?.(layerDef.id, value[0] / 100)
                                      }}
                                      max={100}
                                      step={5}
                                      className="w-full"
                                    />
                                  </div>
                                </>
                              )}
                            </motion.div>
                          )}
                        </motion.div>
                      )
                    })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
