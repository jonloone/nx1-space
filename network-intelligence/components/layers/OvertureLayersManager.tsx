'use client'

import { useEffect } from 'react'
import type mapboxgl from 'mapbox-gl'
import { useLayerStore } from '@/lib/stores/layerStore'
import OvertureLayer from './OvertureLayer'
import type { OvertureTheme } from '@/lib/services/overtureService'

interface OvertureLayersManagerProps {
  map: mapboxgl.Map | null
}

/**
 * OvertureLayersManager Component
 * Manages all Overture Maps layers based on layer store state
 */
export default function OvertureLayersManager({ map }: OvertureLayersManagerProps) {
  const layers = useLayerStore((state) => state.layers)

  // Get Overture layer states
  const buildingsLayer = layers.get('overture-buildings')
  const placesLayer = layers.get('overture-places')
  const transportationLayer = layers.get('overture-transportation')

  return (
    <>
      {/* Buildings Layer */}
      {buildingsLayer && (
        <OvertureLayer
          map={map}
          theme="buildings"
          visible={buildingsLayer.visible}
          opacity={buildingsLayer.opacity}
        />
      )}

      {/* Places Layer */}
      {placesLayer && (
        <OvertureLayer
          map={map}
          theme="places"
          visible={placesLayer.visible}
          opacity={placesLayer.opacity}
        />
      )}

      {/* Transportation Layer */}
      {transportationLayer && (
        <OvertureLayer
          map={map}
          theme="transportation"
          visible={transportationLayer.visible}
          opacity={transportationLayer.opacity}
        />
      )}
    </>
  )
}
