'use client'

/**
 * IC Domain & Layer Selector
 * Unified toolbar for selecting operational domains and analysis layers
 *
 * Displays 6 IC domains (Subsurface, Surface, Maritime, Ground, Air, Space)
 * Shows layer toggles when a domain is selected (Cyber, Social Media, Business Intel)
 */

import React, { useState } from 'react'
import { getAllICDomains, type ICDomain, type ICDomainId } from '@/lib/config/icDomains'
import { getAllICLayers, getCompatibleLayers, type ICLayer, type ICLayerId } from '@/lib/config/icLayers'
import * as Icons from 'lucide-react'

interface AnalysisModeSwitcherProps {
  onDomainChange?: (domain: ICDomain, layers: ICLayerId[]) => void
  currentDomain?: ICDomain
  currentLayers?: ICLayerId[]
  compact?: boolean
}

export function AnalysisModeSwitcher({
  onDomainChange,
  currentDomain,
  currentLayers = [],
  compact = false
}: AnalysisModeSwitcherProps) {
  const [selectedDomain, setSelectedDomain] = useState<ICDomain | undefined>(currentDomain)
  const [selectedLayers, setSelectedLayers] = useState<ICLayerId[]>(currentLayers)

  const domains = getAllICDomains()
  const compatibleLayers = selectedDomain ? getCompatibleLayers(selectedDomain.id) : []

  const handleDomainSelect = (domain: ICDomain) => {
    setSelectedDomain(domain)
    // Reset layers when domain changes
    setSelectedLayers([])
    onDomainChange?.(domain, [])
  }

  const handleLayerToggle = (layerId: ICLayerId) => {
    const newLayers = selectedLayers.includes(layerId)
      ? selectedLayers.filter(l => l !== layerId)
      : [...selectedLayers, layerId]

    setSelectedLayers(newLayers)

    if (selectedDomain) {
      onDomainChange?.(selectedDomain, newLayers)
    }
  }

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return null // No badge for available
      case 'partial':
        return (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-yellow-600/20 text-yellow-400 rounded">
            PARTIAL
          </span>
        )
      case 'unavailable':
        return (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-gray-600/20 text-gray-500 rounded">
            N/A
          </span>
        )
      default:
        return null
    }
  }

  if (compact) {
    // Compact vertical layout for sidebar
    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Domain Buttons - Vertical Stack */}
        <div className="flex flex-col gap-1">
          {domains.map((domain) => {
            const isSelected = selectedDomain?.id === domain.id
            const isUnavailable = domain.status === 'unavailable'

            return (
              <button
                key={domain.id}
                onClick={() => !isUnavailable && handleDomainSelect(domain)}
                disabled={isUnavailable}
                className={`
                  flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-all
                  ${isSelected
                    ? 'bg-blue-600 text-white shadow-lg'
                    : isUnavailable
                    ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white'
                  }
                `}
                title={`${domain.name}${domain.statusMessage ? ` - ${domain.statusMessage}` : ''}`}
              >
                <div className="flex items-center gap-2">
                  {getIcon(domain.icon)}
                  <span className="font-medium truncate">{domain.name}</span>
                </div>
                {getStatusBadge(domain.status)}
              </button>
            )
          })}
        </div>

        {/* Layer Toggles - Show below selected domain */}
        {selectedDomain && compatibleLayers.length > 0 && (
          <div className="flex flex-col gap-1 pt-2 border-t border-gray-700">
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide px-3 mb-1">
              Analysis Layers
            </div>
            {compatibleLayers.map((layer) => {
              const isChecked = selectedLayers.includes(layer.id)
              const isPartial = layer.status === 'partial'

              return (
                <label
                  key={layer.id}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-all
                    ${isChecked
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                    }
                  `}
                  title={`${layer.name}${layer.statusMessage ? ` - ${layer.statusMessage}` : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleLayerToggle(layer.id)}
                    className="w-3 h-3 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1.5 flex-1">
                    {getIcon(layer.icon)}
                    <span className="font-medium truncate">{layer.name}</span>
                    {isPartial && (
                      <span className="ml-auto px-1.5 py-0.5 text-[9px] font-medium bg-yellow-600/20 text-yellow-400 rounded">
                        PARTIAL
                      </span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        )}

        {/* INT Types Badge */}
        {selectedDomain && (
          <div className="px-3 py-2 text-[10px] text-gray-500 border-t border-gray-700">
            <span className="font-medium">INT Types: </span>
            {Object.entries(selectedDomain.capabilities)
              .filter(([, level]) => level !== 'none')
              .map(([intType]) => intType)
              .join(', ')}
          </div>
        )}
      </div>
    )
  }

  // Horizontal toolbar layout (for larger views)
  return (
    <div className="flex flex-col gap-3">
      {/* Domain Buttons - Horizontal */}
      <div className="flex flex-wrap gap-2">
        {domains.map((domain) => {
          const isSelected = selectedDomain?.id === domain.id
          const isUnavailable = domain.status === 'unavailable'

          return (
            <button
              key={domain.id}
              onClick={() => !isUnavailable && handleDomainSelect(domain)}
              disabled={isUnavailable}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-500'
                  : isUnavailable
                  ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-700'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white border border-gray-700'
                }
              `}
              title={`${domain.description}${domain.statusMessage ? ` - ${domain.statusMessage}` : ''}`}
            >
              {getIcon(domain.icon)}
              <span>{domain.name}</span>
              {getStatusBadge(domain.status)}
            </button>
          )
        })}
      </div>

      {/* Layer Toggles - Show below selected domain */}
      {selectedDomain && compatibleLayers.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
          <div className="w-full text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Analysis Layers:
          </div>
          {compatibleLayers.map((layer) => {
            const isChecked = selectedLayers.includes(layer.id)
            const isPartial = layer.status === 'partial'

            return (
              <label
                key={layer.id}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all
                  ${isChecked
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-gray-700'
                  }
                `}
                title={`${layer.description}${layer.statusMessage ? ` - ${layer.statusMessage}` : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleLayerToggle(layer.id)}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  {getIcon(layer.icon)}
                  <span className="font-medium">{layer.name}</span>
                  {isPartial && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-yellow-600/20 text-yellow-400 rounded">
                      PARTIAL
                    </span>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      )}

      {/* INT Types & Capabilities Info */}
      {selectedDomain && (
        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-700">
          <div>
            <span className="font-medium text-gray-400">INT Types: </span>
            {Object.entries(selectedDomain.capabilities)
              .filter(([, level]) => level === 'strong' || level === 'moderate')
              .map(([intType, level]) => (
                <span key={intType} className={level === 'strong' ? 'text-blue-400' : ''}>
                  {intType}
                </span>
              ))
              .reduce((prev, curr, idx) => idx === 0 ? [curr] : [...prev, ', ', curr], [] as any[])}
          </div>
          {selectedLayers.length > 0 && (
            <div>
              <span className="font-medium text-gray-400">Active Layers: </span>
              {selectedLayers.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
