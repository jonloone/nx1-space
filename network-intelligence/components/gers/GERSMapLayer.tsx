'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { GERSPlace } from '@/lib/services/gersDemoService'

interface GERSMapLayerProps {
  map: mapboxgl.Map | null
  places: GERSPlace[]
  onPlaceClick?: (place: GERSPlace) => void
}

export default function GERSMapLayer({ map, places, onPlaceClick }: GERSMapLayerProps) {
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add new markers
    places.forEach(place => {
      const [lng, lat] = place.location.coordinates

      // Create marker element
      const el = document.createElement('div')
      el.className = 'gers-marker'
      el.innerHTML = `
        <div class="w-10 h-10 bg-white rounded-full shadow-lg border-2 border-blue-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
          <span class="text-lg">${getCategoryEmoji(place.categories[0])}</span>
        </div>
      `

      // Create marker
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map)

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div class="p-2">
            <div class="font-semibold text-sm mb-1">${place.name}</div>
            <div class="text-xs text-gray-600">${place.categories[0].replace(/_/g, ' ')}</div>
            ${place.distance ? `
              <div class="text-xs text-blue-600 mt-1 font-medium">
                ${formatDistance(place.distance)} ${formatBearing(place.bearing || 0)}
              </div>
            ` : ''}
          </div>
        `)

      marker.setPopup(popup)

      // Click handler
      el.addEventListener('click', () => {
        if (onPlaceClick) {
          onPlaceClick(place)
        }
      })

      markersRef.current.push(marker)
    })

    // Fit bounds if we have places
    if (places.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      places.forEach(place => {
        bounds.extend(place.location.coordinates as [number, number])
      })
      map.fitBounds(bounds, { padding: 100, maxZoom: 13 })
    }

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }
  }, [map, places, onPlaceClick])

  return null
}

// Helper functions
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    port: '⚓',
    marine_terminal: '🚢',
    fuel_dock: '⛽',
    customs_office: '🏛️',
    ship_repair: '🔧',
    warehouse: '📦',
    logistics_facility: '🏭',
    delivery_stop: '📍',
    truck_stop: '🚛',
    gas_station: '⛽',
    restaurant: '🍔',
    hospital: '🏥',
    emergency_room: '🚨',
    police_station: '👮',
    fire_station: '🚒',
    power_station: '⚡',
    telecom_facility: '📡',
    border_crossing: '🛂',
    airport: '✈️',
    critical_infrastructure: '🏗️'
  }
  return emojiMap[category] || '📍'
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

function formatBearing(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}
