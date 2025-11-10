'use client'

/**
 * Ground Domain Toolbar
 * Floating toolbar for Ground domain operations
 * Contains: Building visualization, Places, Transportation controls
 */

import { useState } from 'react'
import type mapboxgl from 'mapbox-gl'
import { Building2, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { LayerManager } from '@/components/space/shared/LayerManager'

interface GroundDomainToolbarProps {
  map: mapboxgl.Map | null
  isVisible: boolean
  onClose?: () => void
  className?: string
}

export function GroundDomainToolbar({ map, isVisible, onClose, className = '' }: GroundDomainToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-20 right-4 z-32 transition-all duration-300 ${
        isCollapsed ? 'w-12' : 'w-80'
      } ${className}`}
    >
      <div className="bg-gray-900/95 backdrop-blur border border-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          {!isCollapsed && (
            <>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Ground Domain</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                  title="Collapse"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </>
          )}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 hover:bg-gray-800 rounded transition-colors w-full flex justify-center"
              title="Expand"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content - Only show when not collapsed */}
        {!isCollapsed && (
          <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Layer Controls */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Layer Controls
                </h4>
                <LayerManager />
              </div>

              {/* Additional Ground-specific controls can go here */}
              <div className="pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 italic">
                  Additional ground domain controls coming soon
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
