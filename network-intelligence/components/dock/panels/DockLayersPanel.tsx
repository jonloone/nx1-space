'use client'

/**
 * Dock Layers Panel
 * Layer visibility and control panel for the unified dock
 */

import { LayerManager } from '@/components/space/shared/LayerManager'

export function DockLayersPanel() {
  return (
    <div className="h-full flex flex-col bg-gray-900 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">Map Layers</h3>
        <p className="text-xs text-gray-400 mt-1">Control layer visibility and properties</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <LayerManager />
      </div>
    </div>
  )
}
