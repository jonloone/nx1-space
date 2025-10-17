'use client'

import React from 'react'
import { MapPin, Navigation, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PanelHeader, PanelSection } from './BottomSheet'
import { usePanelStore } from '@/lib/stores/panelStore'
import { useMapStore } from '@/lib/stores/mapStore'

interface SearchResult {
  id: string
  name: string
  category?: string
  address?: string
  distance?: number // in meters
  coordinates: [number, number] // [lng, lat]
  rating?: number
  isOpen?: boolean
}

interface SearchResultsPanelData {
  query: string
  results: SearchResult[]
  total: number
}

export default function SearchResultsPanel() {
  const { content } = usePanelStore()
  const { flyTo } = useMapStore()

  if (!content || content.type !== 'search-results') {
    return <div className="p-6 text-muted-foreground">No results</div>
  }

  const data = content.data as SearchResultsPanelData

  const handleResultClick = (result: SearchResult) => {
    // Fly to location on map
    flyTo(result.coordinates[0], result.coordinates[1], 15)
  }

  const handleGetDirections = (result: SearchResult) => {
    // TODO: Open directions panel
    console.log('Get directions to:', result.name)
  }

  return (
    <>
      <PanelHeader
        title={`Found ${data.total} result${data.total !== 1 ? 's' : ''}`}
        subtitle={`Searching for: ${data.query}`}
      />

      <PanelSection>
        <div className="space-y-3">
          {data.results.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onSelect={() => handleResultClick(result)}
              onGetDirections={() => handleGetDirections(result)}
            />
          ))}
        </div>

        {data.total > data.results.length && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Show {data.total - data.results.length} more results
            </Button>
          </div>
        )}
      </PanelSection>
    </>
  )
}

function ResultCard({
  result,
  onSelect,
  onGetDirections
}: {
  result: SearchResult
  onSelect: () => void
  onGetDirections: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <MapPin className="h-5 w-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name & Category */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{result.name}</h4>
              {result.category && (
                <p className="text-sm text-muted-foreground capitalize">{result.category}</p>
              )}
            </div>

            {/* Rating */}
            {result.rating !== undefined && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{result.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {result.address && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{result.address}</p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2">
            {/* Distance */}
            {result.distance !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Navigation className="h-3 w-3" />
                <span>{formatDistance(result.distance)}</span>
              </div>
            )}

            {/* Open Status */}
            {result.isOpen !== undefined && (
              <Badge
                variant={result.isOpen ? 'default' : 'secondary'}
                className="text-xs"
              >
                {result.isOpen ? 'Open now' : 'Closed'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <MapPin className="h-3.5 w-3.5 mr-1.5" />
          View on Map
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation()
            onGetDirections()
          }}
        >
          <Navigation className="h-3.5 w-3.5 mr-1.5" />
          Directions
        </Button>
      </div>
    </div>
  )
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  } else {
    return `${(meters / 1000).toFixed(1)} km`
  }
}
