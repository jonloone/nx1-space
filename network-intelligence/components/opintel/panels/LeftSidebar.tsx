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
  SkipBack
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

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
  layers?: Layer[]
  liveStreams?: LiveStream[]
  onAddDataSource?: () => void
  onToggleLayer?: (layerId: string) => void
  onLayerSettings?: (layerId: string) => void
  onStreamToggle?: (streamId: string) => void
}

export default function LeftSidebar({
  dataSources = [],
  layers = [],
  liveStreams = [],
  onAddDataSource,
  onToggleLayer,
  onLayerSettings,
  onStreamToggle
}: LeftSidebarProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())

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
        return 'bg-green-500'
      case 'disconnected':
      case 'error':
        return 'bg-red-500'
      case 'loading':
      case 'paused':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
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
    <div className="h-full flex flex-col bg-black/20 backdrop-blur-sm">
      <Tabs defaultValue="data" className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="px-3 pt-3 pb-2">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="data" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              Data
            </TabsTrigger>
            <TabsTrigger value="layers" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs">
              <Radio className="h-3 w-3 mr-1" />
              Live
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Data Sources Tab */}
        <TabsContent value="data" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="px-3 pb-3 space-y-2">
              {/* Add Data Source Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs border-white/10 hover:bg-white/5"
                onClick={onAddDataSource}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Data Source
              </Button>

              <Separator className="bg-white/10" />

              {/* Data Sources List */}
              {dataSources.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">
                  No data sources connected
                </div>
              ) : (
                <div className="space-y-1">
                  {dataSources.map((source) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 rounded-md hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-white/60">
                          {getDataSourceIcon(source.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-white truncate">
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
                            <div className="text-[10px] text-white/40">
                              {source.recordCount.toLocaleString()} records
                            </div>
                          )}
                          {source.lastUpdated && (
                            <div className="text-[10px] text-white/40">
                              Updated {source.lastUpdated}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Refresh</DropdownMenuItem>
                            <DropdownMenuItem>Configure</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400">
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
        <TabsContent value="layers" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="px-3 pb-3 space-y-2">
              {/* Layer Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start text-xs border-white/10 hover:bg-white/5"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Layer
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>

              <Separator className="bg-white/10" />

              {/* Layers List */}
              {layers.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">
                  No layers added
                </div>
              ) : (
                <div className="space-y-1">
                  {layers.map((layer) => (
                    <motion.div
                      key={layer.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-md hover:bg-white/5 transition-colors"
                    >
                      {/* Layer Header */}
                      <div className="flex items-center gap-2 p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-3 w-3 text-white/40" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0"
                          onClick={() => toggleLayerExpanded(layer.id)}
                        >
                          {expandedLayers.has(layer.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>

                        {layer.color && (
                          <div
                            className="w-3 h-3 rounded shrink-0"
                            style={{ backgroundColor: layer.color }}
                          />
                        )}

                        <span className="text-xs font-medium text-white flex-1 truncate">
                          {layer.name}
                        </span>

                        <Switch
                          checked={layer.visible}
                          onCheckedChange={() => onToggleLayer?.(layer.id)}
                          className="shrink-0 scale-75"
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => onLayerSettings?.(layer.id)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Expanded Layer Details */}
                      {expandedLayers.has(layer.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-2 space-y-2"
                        >
                          <div className="text-[10px] text-white/40">
                            Type: {layer.type}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/60">Opacity</span>
                            <div className="flex-1 h-1 bg-white/10 rounded-full">
                              <div
                                className="h-full bg-white/60 rounded-full"
                                style={{ width: `${layer.opacity * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-white/40">
                              {Math.round(layer.opacity * 100)}%
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Live Streams Tab */}
        <TabsContent value="live" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full">
            <div className="px-3 pb-3 space-y-2">
              {/* Stream Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start text-xs border-white/10 hover:bg-white/5"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Stream
                </Button>
              </div>

              <Separator className="bg-white/10" />

              {/* Live Streams List */}
              {liveStreams.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">
                  No live streams connected
                </div>
              ) : (
                <div className="space-y-2">
                  {liveStreams.map((stream) => (
                    <motion.div
                      key={stream.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 rounded-md bg-white/5 space-y-2"
                    >
                      {/* Stream Header */}
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {stream.status === 'active' ? (
                            <Wifi className="h-4 w-4 text-green-500" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-white truncate">
                              {stream.name}
                            </span>
                            <Badge
                              variant={stream.status === 'active' ? 'default' : 'destructive'}
                              className="text-[10px] h-4"
                            >
                              {stream.status}
                            </Badge>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-[10px] text-white/60">
                              {stream.messagesPerSecond.toFixed(1)} msg/s
                            </div>
                            <div className="text-[10px] text-white/40">
                              {stream.totalMessages.toLocaleString()} total
                            </div>
                            <div className="text-[10px] text-white/40">
                              {stream.latency}ms latency
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stream Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onStreamToggle?.(stream.id)}
                        >
                          {stream.status === 'active' ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <SkipBack className="h-3 w-3" />
                        </Button>
                        <div className="flex-1" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Configure</DropdownMenuItem>
                            <DropdownMenuItem>View Logs</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400">
                              Disconnect
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
      </Tabs>
    </div>
  )
}
