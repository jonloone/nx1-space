'use client'

/**
 * Toolbar Manager
 * Manages multiple domain toolbars and their visibility
 * Prevents overlap and handles positioning
 */

import { useEffect, useState } from 'react'
import type mapboxgl from 'mapbox-gl'
import type { ICDomainId } from '@/lib/config/icDomains'
import { SpaceDomainToolbar } from './SpaceDomainToolbar'
import { GroundDomainToolbar } from './GroundDomainToolbar'
import { useMapStore } from '@/lib/stores/mapStore'

interface ToolbarManagerProps {
  map: mapboxgl.Map | null
  activeDomains?: ICDomainId[]
  className?: string
}

export function ToolbarManager({ map, activeDomains = ['ground'], className = '' }: ToolbarManagerProps) {
  const [visibleToolbars, setVisibleToolbars] = useState<Set<ICDomainId>>(new Set(['ground']))

  // Update visible toolbars when active domains change
  useEffect(() => {
    setVisibleToolbars(new Set(activeDomains))
  }, [activeDomains])

  const handleCloseToolbar = (domainId: ICDomainId) => {
    setVisibleToolbars(prev => {
      const newSet = new Set(prev)
      newSet.delete(domainId)
      return newSet
    })
  }

  // Calculate vertical offset for stacking toolbars
  const getToolbarOffset = (index: number) => {
    // Start at top-20, add spacing for each toolbar
    const baseOffset = 80 // 20px (top) + 60px (header height estimate)
    const toolbarSpacing = 450 // Approximate height of each toolbar
    return baseOffset + (index * toolbarSpacing)
  }

  // Get array of visible domains
  const visibleDomainsList = Array.from(visibleToolbars)

  return (
    <div className={`${className}`}>
      {/* Space Domain Toolbar */}
      {visibleToolbars.has('space') && (
        <SpaceDomainToolbar
          map={map}
          isVisible={true}
          onClose={() => handleCloseToolbar('space')}
          className={visibleDomainsList.length > 1 ? `top-[${getToolbarOffset(visibleDomainsList.indexOf('space'))}px]` : ''}
        />
      )}

      {/* Ground Domain Toolbar */}
      {visibleToolbars.has('ground') && (
        <GroundDomainToolbar
          map={map}
          isVisible={true}
          onClose={() => handleCloseToolbar('ground')}
          className={visibleDomainsList.length > 1 ? `top-[${getToolbarOffset(visibleDomainsList.indexOf('ground'))}px]` : ''}
        />
      )}

      {/* Maritime Domain Toolbar - Placeholder */}
      {/* {visibleToolbars.has('maritime') && (
        <MaritimeDomainToolbar
          map={map}
          isVisible={true}
          onClose={() => handleCloseToolbar('maritime')}
        />
      )} */}

      {/* Surface Domain Toolbar - Placeholder */}
      {/* {visibleToolbars.has('surface') && (
        <SurfaceDomainToolbar
          map={map}
          isVisible={true}
          onClose={() => handleCloseToolbar('surface')}
        />
      )} */}

      {/* Additional domain toolbars can be added here */}
    </div>
  )
}
