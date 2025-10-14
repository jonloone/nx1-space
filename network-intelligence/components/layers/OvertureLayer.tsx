'use client'

import { useEffect, useRef } from 'react'
import type mapboxgl from 'mapbox-gl'
import { getOvertureService, type OvertureTheme } from '@/lib/services/overtureService'

interface OvertureLayerProps {
  map: mapboxgl.Map | null
  theme: OvertureTheme
  visible: boolean
  opacity: number
}

/**
 * OvertureLayer Component
 * Renders Overture Maps data layer on Mapbox map
 */
export default function OvertureLayer({
  map,
  theme,
  visible,
  opacity
}: OvertureLayerProps) {
  const sourceId = `overture-${theme}-source`
  const layerId = `overture-${theme}`
  const addedRef = useRef(false)

  useEffect(() => {
    if (!map || addedRef.current) return

    const overtureService = getOvertureService()
    const configs = overtureService.getLayerConfigs()
    const config = configs.find(c => c.theme === theme)

    if (!config) {
      console.warn(`No configuration found for theme: ${theme}`)
      return
    }

    try {
      // Wait for map to load
      if (!map.loaded()) {
        map.once('load', () => addLayer())
      } else {
        addLayer()
      }

      function addLayer() {
        if (!map || addedRef.current) return

        // Add source
        if (!map.getSource(sourceId)) {
          const source = overtureService.getMapboxSource(config!)
          map.addSource(sourceId, source)
        }

        // Add layer
        if (!map.getLayer(layerId)) {
          const style = overtureService.getMapboxStyle(config!)
          map.addLayer({
            ...style,
            layout: {
              ...style.layout,
              visibility: visible ? 'visible' : 'none'
            },
            paint: {
              ...style.paint,
              ...(getOpacityPaint(config!.type, opacity))
            }
          })

          addedRef.current = true
        }
      }

      // Cleanup
      return () => {
        if (map && addedRef.current) {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId)
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId)
          }
          addedRef.current = false
        }
      }
    } catch (error) {
      console.error(`Error adding Overture layer ${theme}:`, error)
    }
  }, [map, theme, sourceId, layerId])

  // Update visibility
  useEffect(() => {
    if (!map || !addedRef.current) return

    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          visible ? 'visible' : 'none'
        )
      }
    } catch (error) {
      console.error(`Error updating visibility for ${theme}:`, error)
    }
  }, [map, layerId, visible, theme])

  // Update opacity
  useEffect(() => {
    if (!map || !addedRef.current) return

    try {
      if (map.getLayer(layerId)) {
        const layer = map.getLayer(layerId)
        const type = layer?.type

        if (type === 'fill') {
          map.setPaintProperty(layerId, 'fill-opacity', opacity)
        } else if (type === 'fill-extrusion') {
          map.setPaintProperty(layerId, 'fill-extrusion-opacity', opacity)
        } else if (type === 'line') {
          map.setPaintProperty(layerId, 'line-opacity', opacity)
        } else if (type === 'circle') {
          map.setPaintProperty(layerId, 'circle-opacity', opacity)
        } else if (type === 'symbol') {
          map.setPaintProperty(layerId, 'text-opacity', opacity)
          map.setPaintProperty(layerId, 'icon-opacity', opacity)
        }
      }
    } catch (error) {
      console.error(`Error updating opacity for ${theme}:`, error)
    }
  }, [map, layerId, opacity, theme])

  return null
}

/**
 * Get opacity paint properties based on layer type
 */
function getOpacityPaint(type: string, opacity: number): Record<string, number> {
  switch (type) {
    case 'fill':
      return { 'fill-opacity': opacity }
    case 'fill-extrusion':
      return { 'fill-extrusion-opacity': opacity }
    case 'line':
      return { 'line-opacity': opacity }
    case 'circle':
      return { 'circle-opacity': opacity }
    case 'symbol':
      return { 'text-opacity': opacity, 'icon-opacity': opacity }
    default:
      return {}
  }
}
