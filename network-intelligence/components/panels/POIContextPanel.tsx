'use client'

import React from 'react'
import {
  MapPin,
  Navigation,
  Clock,
  Star,
  Phone,
  ExternalLink,
  Bookmark,
  Share2,
  TrendingUp,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PanelHeader, PanelSection } from './BottomSheet'
import { usePanelStore } from '@/lib/stores/panelStore'
import { useMapStore } from '@/lib/stores/mapStore'

interface POIData {
  id: string
  name: string
  category: string
  address: string
  coordinates: [number, number] // [lng, lat]

  // Optional enrichment data
  rating?: number
  reviewCount?: number
  priceLevel?: number // 1-4 ($-$$$$)
  hours?: {
    isOpen: boolean
    opensAt?: string
    closesAt?: string
  }
  phone?: string
  website?: string

  // AI-powered insights
  behavioralScore?: number // 0-100
  insights?: string[]
  visitPattern?: {
    peakHours: string[]
    typicalDuration: string
  }

  // Related places
  nearbyPlaces?: Array<{
    id: string
    name: string
    category: string
    distance: number
  }>
}

interface POIContextPanelData {
  poi: POIData
}

export default function POIContextPanel() {
  const { content, setDetent } = usePanelStore()
  const { flyTo } = useMapStore()

  if (!content || content.type !== 'poi-context') {
    return <div className="p-6 text-muted-foreground">No location selected</div>
  }

  const data = content.data as POIContextPanelData
  const poi = data.poi

  const handleGetDirections = () => {
    // TODO: Open directions panel
    console.log('Get directions to:', poi.name)
  }

  const handleViewNearby = (nearbyPoi: any) => {
    flyTo(nearbyPoi.coordinates[0], nearbyPoi.coordinates[1], 16)
  }

  return (
    <>
      <PanelHeader
        title={poi.name}
        subtitle={poi.category}
      />

      {/* Quick Info */}
      <PanelSection>
        <div className="space-y-3">
          {/* Rating & Hours */}
          <div className="flex items-center gap-3 flex-wrap">
            {poi.rating !== undefined && (
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{poi.rating.toFixed(1)}</span>
                {poi.reviewCount && (
                  <span className="text-sm text-muted-foreground">({poi.reviewCount})</span>
                )}
              </div>
            )}

            {poi.priceLevel && (
              <div className="flex items-center gap-0.5 text-muted-foreground">
                {Array.from({ length: poi.priceLevel }, (_, i) => (
                  <span key={i} className="text-primary">$</span>
                ))}
                {Array.from({ length: 4 - poi.priceLevel }, (_, i) => (
                  <span key={i}>$</span>
                ))}
              </div>
            )}

            {poi.hours && (
              <Badge variant={poi.hours.isOpen ? 'default' : 'secondary'}>
                {poi.hours.isOpen ? 'Open now' : 'Closed'}
                {poi.hours.isOpen && poi.hours.closesAt && ` • Closes ${poi.hours.closesAt}`}
              </Badge>
            )}
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{poi.address}</span>
          </div>

          {/* Contact */}
          <div className="flex items-center gap-3">
            {poi.phone && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => window.open(`tel:${poi.phone}`)}
              >
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Call
              </Button>
            )}
            {poi.website && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => window.open(poi.website, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Website
              </Button>
            )}
          </div>
        </div>
      </PanelSection>

      {/* Quick Actions */}
      <PanelSection>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="default"
            className="w-full"
            onClick={handleGetDirections}
          >
            <Navigation className="h-4 w-4 mr-1.5" />
            Directions
          </Button>
          <Button variant="outline" className="w-full">
            <Bookmark className="h-4 w-4 mr-1.5" />
            Save
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
        </div>
      </PanelSection>

      {/* AI Insights */}
      {(poi.behavioralScore !== undefined || poi.insights) && (
        <PanelSection title="Intelligence Insights">
          <div className="space-y-3">
            {poi.behavioralScore !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Behavioral Score</span>
                </div>
                <Badge variant={poi.behavioralScore >= 70 ? 'default' : 'secondary'}>
                  {poi.behavioralScore}/100
                </Badge>
              </div>
            )}

            {poi.insights && poi.insights.length > 0 && (
              <div className="space-y-2">
                {poi.insights.map((insight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"
                  >
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{insight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PanelSection>
      )}

      {/* Visit Patterns */}
      {poi.visitPattern && (
        <PanelSection title="Visit Patterns">
          <div className="space-y-3">
            {poi.visitPattern.peakHours && poi.visitPattern.peakHours.length > 0 && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Peak Hours</p>
                  <p className="text-sm text-muted-foreground">
                    {poi.visitPattern.peakHours.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {poi.visitPattern.typicalDuration && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Typical Visit</p>
                  <p className="text-sm text-muted-foreground">
                    {poi.visitPattern.typicalDuration}
                  </p>
                </div>
              </div>
            )}
          </div>
        </PanelSection>
      )}

      {/* Nearby Places */}
      {poi.nearbyPlaces && poi.nearbyPlaces.length > 0 && (
        <PanelSection title="Nearby Places">
          <div className="space-y-2">
            {poi.nearbyPlaces.map((nearbyPoi) => (
              <button
                key={nearbyPoi.id}
                onClick={() => handleViewNearby(nearbyPoi)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{nearbyPoi.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {nearbyPoi.category} • {formatDistance(nearbyPoi.distance)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={() => setDetent('expanded')}
          >
            See All Nearby Places
          </Button>
        </PanelSection>
      )}

      {/* More Details */}
      <PanelSection>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setDetent('expanded')}
        >
          View Full Details
        </Button>
      </PanelSection>
    </>
  )
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  } else {
    return `${(meters / 1000).toFixed(1)} km`
  }
}
