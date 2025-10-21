'use client'

/**
 * Location Analysis Panel
 *
 * Detailed analysis panel displayed when clicking a location marker.
 * Shows temporal data, building context, significance indicators,
 * and placeholders for imagery intelligence.
 *
 * Features:
 * - Location details and address
 * - Building information (from Overture Maps)
 * - POI context
 * - Temporal analysis (arrival/departure, dwell time, frequency)
 * - Significance indicator
 * - EO imagery placeholder
 * - CCTV footage placeholder
 * - Investigation notes
 *
 * ⚠️ LEGAL DISCLAIMER: For authorized law enforcement use only.
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Building2,
  AlertTriangle,
  Camera,
  Satellite,
  FileText,
  TrendingUp,
  Navigation,
  Store
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { LocationStop } from '@/lib/demo/investigation-demo-data'
import type { EnrichedLocation } from '@/lib/services/enrichedScenarioLoader'
import { getPOIContextService } from '@/lib/services/poiContextService'

interface LocationAnalysisProps {
  location: EnrichedLocation
  buildingInfo?: {
    name?: string
    type?: string
    levels?: number
    occupancy?: string
  }
  onClose: () => void
}

export default function LocationAnalysis({ location, buildingInfo, onClose }: LocationAnalysisProps) {
  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'routine':
        return {
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#065F46]',
          border: 'border-[#10B981]',
          icon: '🟢'
        }
      case 'suspicious':
        return {
          bg: 'bg-[#FEF3C7]',
          text: 'text-[#92400E]',
          border: 'border-[#F59E0B]',
          icon: '🟠'
        }
      case 'anomaly':
        return {
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#991B1B]',
          border: 'border-[#EF4444]',
          icon: '🔴'
        }
      default:
        return {
          bg: 'bg-[#F5F5F5]',
          text: 'text-[#525252]',
          border: 'border-[#E5E5E5]',
          icon: '⚪'
        }
    }
  }

  const significanceStyle = getSignificanceColor(location.significance)

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getTimeOfDay = (date: Date) => {
    const hour = date.getHours()
    if (hour >= 5 && hour < 9) return 'Early Morning'
    if (hour >= 9 && hour < 12) return 'Morning'
    if (hour >= 12 && hour < 17) return 'Afternoon'
    if (hour >= 17 && hour < 21) return 'Evening'
    if (hour >= 21 || hour < 5) return 'Night/Late Night'
    return 'Unknown'
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-[#E5E5E5]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#525252]" />
          <h3 className="text-sm font-semibold text-[#171717]">Location Analysis</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 hover:bg-[#F5F5F5]"
        >
          <X className="h-4 w-4 text-[#525252]" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Location Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div>
              <h4 className="text-lg font-bold text-[#171717] mb-1">{location.name}</h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs capitalize',
                    significanceStyle.border,
                    significanceStyle.text
                  )}
                >
                  {significanceStyle.icon} {location.significance}
                </Badge>
                <Badge variant="outline" className="text-xs border-[#E5E5E5] text-[#525252] capitalize">
                  {location.type}
                </Badge>
              </div>
            </div>

            {/* Coordinates */}
            <div className="flex items-center gap-2 text-xs text-[#737373] font-mono">
              <Navigation className="h-3 w-3" />
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>

            {/* Validation Status */}
            {location.validationStatus && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  location.validationStatus === 'verified'
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : location.validationStatus === 'approximated'
                    ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                    : 'border-gray-400 text-gray-600 bg-gray-50'
                )}
              >
                {location.validationStatus === 'verified'
                  ? '✓ Verified Address'
                  : location.validationStatus === 'approximated'
                  ? '⚠️ Approximated'
                  : '✗ Unvalidated'}
                {location.validationConfidence &&
                  ` (${(location.validationConfidence * 100).toFixed(0)}%)`}
              </Badge>
            )}

            {/* Context Summary */}
            {location.contextSummary && (
              <div className="text-xs text-[#737373] italic">
                📍 {location.contextSummary}
              </div>
            )}

            {/* Significance Note */}
            {location.notes && (
              <Card className={cn('border', significanceStyle.border, significanceStyle.bg)}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn('h-4 w-4 mt-0.5 flex-shrink-0', significanceStyle.text)} />
                    <p className={cn('text-xs', significanceStyle.text)}>{location.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          <Separator className="bg-[#E5E5E5]" />

          {/* Temporal Analysis */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#525252] flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Temporal Analysis
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-white border border-[#E5E5E5]">
                <CardContent className="p-3">
                  <div className="text-[10px] text-[#737373] mb-1">Dwell Time</div>
                  <div className="text-lg font-bold text-[#171717]">
                    {formatDuration(location.dwellTimeMinutes)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-[#E5E5E5]">
                <CardContent className="p-3">
                  <div className="text-[10px] text-[#737373] mb-1">Visit Count</div>
                  <div className="text-lg font-bold text-[#171717]">{location.visitCount}</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[#737373]">Arrival Time</span>
                <span className="text-[#171717] font-medium">{formatTime(location.arrivalTime)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-[#737373]">Departure Time</span>
                <span className="text-[#171717] font-medium">{formatTime(location.departureTime)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-[#737373]">Time of Day</span>
                <Badge variant="outline" className="text-[10px] border-[#E5E5E5] text-[#525252]">
                  {getTimeOfDay(location.arrivalTime)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-[#E5E5E5]" />

          {/* Building Context */}
          {buildingInfo && (
            <>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#525252] flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" />
                  Building Information
                </h4>

                <div className="space-y-2 text-xs">
                  {buildingInfo.name && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#737373]">Building Name</span>
                      <span className="text-[#171717] font-medium">{buildingInfo.name}</span>
                    </div>
                  )}

                  {buildingInfo.type && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#737373]">Type</span>
                      <span className="text-[#171717] font-medium capitalize">{buildingInfo.type}</span>
                    </div>
                  )}

                  {buildingInfo.levels && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#737373]">Levels</span>
                      <span className="text-[#171717] font-medium">{buildingInfo.levels}</span>
                    </div>
                  )}

                  {buildingInfo.occupancy && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#737373]">Occupancy</span>
                      <span className="text-[#171717] font-medium">{buildingInfo.occupancy}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-[#E5E5E5]" />
            </>
          )}

          {/* Nearby Points of Interest */}
          {location.nearbyPOIs && location.nearbyPOIs.length > 0 && (
            <>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#525252] flex items-center gap-2">
                  <Store className="h-3.5 w-3.5" />
                  Nearby Points of Interest
                </h4>

                <div className="space-y-2">
                  {location.nearbyPOIs.slice(0, 8).map((poi) => {
                    const poiService = getPOIContextService()
                    const categoryColor = poiService.getCategoryColor(poi.category)

                    return (
                      <Card key={poi.id} className="bg-white border border-[#E5E5E5]">
                        <CardContent className="p-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: categoryColor }}
                                />
                                <span className="text-xs font-medium text-[#171717] truncate">
                                  {poi.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#737373] capitalize">
                                {poi.category.replace(/_/g, ' ')}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-medium text-[#171717]">
                                {(poi.distance / 1000).toFixed(1)} km
                              </div>
                              <div className="text-[10px] text-[#737373]">
                                {poi.bearing}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {location.nearbyPOIs.length > 8 && (
                  <div className="text-xs text-[#737373] text-center pt-1">
                    + {location.nearbyPOIs.length - 8} more nearby
                  </div>
                )}
              </div>

              <Separator className="bg-[#E5E5E5]" />
            </>
          )}

          {/* Intelligence Assets */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#525252] flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Intelligence Assets
            </h4>

            <Tabs defaultValue="imagery" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#F5F5F5] border border-[#E5E5E5]">
                <TabsTrigger value="imagery" className="text-xs">
                  <Satellite className="h-3 w-3 mr-1" />
                  EO Imagery
                </TabsTrigger>
                <TabsTrigger value="cctv" className="text-xs">
                  <Camera className="h-3 w-3 mr-1" />
                  CCTV
                </TabsTrigger>
              </TabsList>

              <TabsContent value="imagery" className="mt-3">
                <EOImageryPlaceholder location={location} />
              </TabsContent>

              <TabsContent value="cctv" className="mt-3">
                <CCTVPlaceholder location={location} />
              </TabsContent>
            </Tabs>
          </div>

          <Separator className="bg-[#E5E5E5]" />

          {/* Investigation Notes */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#525252] flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              Investigation Notes
            </h4>

            <Card className="bg-[#F5F5F5] border border-[#E5E5E5]">
              <CardContent className="p-3">
                <textarea
                  placeholder="Add investigation notes for this location..."
                  className="w-full h-20 bg-transparent text-xs text-[#171717] placeholder:text-[#A3A3A3] resize-none focus:outline-none"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#E5E5E5] space-y-2">
        <Button className="w-full bg-[#176BF8] hover:bg-[#0D4DB8] text-white" size="sm">
          View on Map
        </Button>
        <Button
          variant="outline"
          className="w-full border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]"
          size="sm"
        >
          Export Report
        </Button>
      </div>
    </div>
  )
}

/**
 * EO Imagery Placeholder
 */
function EOImageryPlaceholder({ location }: { location: LocationStop }) {
  return (
    <Card className="bg-white border border-[#E5E5E5]">
      <CardContent className="p-3">
        <div className="aspect-video bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] rounded flex items-center justify-center mb-2">
          <Satellite className="h-12 w-12 text-white/30" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-[#171717]">Sentinel-2 Imagery Available</div>
          <div className="text-[10px] text-[#737373]">
            Latest capture: {formatTime(location.arrivalTime)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]"
          >
            Request Imagery
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * CCTV Footage Placeholder
 */
function CCTVPlaceholder({ location }: { location: LocationStop }) {
  return (
    <Card className="bg-white border border-[#E5E5E5]">
      <CardContent className="p-3">
        <div className="aspect-video bg-gradient-to-br from-[#525252] to-[#737373] rounded flex items-center justify-center mb-2">
          <Camera className="h-12 w-12 text-white/30" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-medium text-[#171717]">CCTV Footage Available</div>
          <div className="text-[10px] text-[#737373]">
            Timeframe: {formatTime(location.arrivalTime)} - {formatTime(location.departureTime)}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 text-xs border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]"
          >
            Request Footage
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
