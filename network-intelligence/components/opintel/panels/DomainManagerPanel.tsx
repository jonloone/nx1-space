'use client'

/**
 * Domain Manager Panel
 * Right panel for configuring IC operational domains and analysis layers
 * Supports multi-domain selection and preset workflows
 */

import React, { useState } from 'react'
import { X, Layers, RotateCcw, Check } from 'lucide-react'
import { PresetButton } from '@/components/opintel/presets/PresetButton'
import { INTELLIGENCE_PRESETS } from '@/lib/config/intelligencePresets'
import { getAllICDomains, type ICDomain, type ICDomainId } from '@/lib/config/icDomains'
import { getAllICLayers, getCompatibleLayers, type ICLayer, type ICLayerId } from '@/lib/config/icLayers'
import { useMapStore } from '@/lib/stores/mapStore'
import { getDomainLayerService } from '@/lib/services/domainLayerService'

interface DomainManagerPanelProps {
  onClose?: () => void
  initialDomain?: ICDomainId
  initialLayers?: ICLayerId[]
  onApply?: (domains: ICDomainId[], layers: ICLayerId[]) => void
}

export function DomainManagerPanel({
  onClose,
  initialDomain = 'ground',
  initialLayers = [],
  onApply
}: DomainManagerPanelProps) {
  const [selectedDomains, setSelectedDomains] = useState<ICDomainId[]>([initialDomain])
  const [selectedLayers, setSelectedLayers] = useState<ICLayerId[]>(initialLayers)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const mapStore = useMapStore()
  const domains = getAllICDomains()
  const allLayers = getAllICLayers()

  // Get layers compatible with ANY selected domain
  const compatibleLayers = selectedDomains.length > 0
    ? allLayers.filter(layer =>
        selectedDomains.some(domainId =>
          getCompatibleLayers(domainId).some(l => l.id === layer.id)
        )
      )
    : []

  const handleDomainToggle = (domainId: ICDomainId) => {
    setSelectedDomains(prev => {
      if (prev.includes(domainId)) {
        // Remove domain (but keep at least one)
        return prev.length > 1 ? prev.filter(d => d !== domainId) : prev
      } else {
        // Add domain
        return [...prev, domainId]
      }
    })
    setActivePreset(null) // Clear preset when manual change
  }

  const handleLayerToggle = (layerId: ICLayerId) => {
    setSelectedLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(l => l !== layerId)
      } else {
        return [...prev, layerId]
      }
    })
    setActivePreset(null) // Clear preset when manual change
  }

  const handlePresetClick = (presetId: string) => {
    const presetKey = presetId.toUpperCase().replace(/-/g, '_')
    const preset = INTELLIGENCE_PRESETS[presetKey]

    if (!preset) return

    // Infer domains from preset's intelligence focus
    const inferredDomains: ICDomainId[] = []

    if (preset.intelFocus.domains.includes('GEOINT')) {
      inferredDomains.push('ground')
    }
    if (preset.intelFocus.domains.includes('SIGINT')) {
      // SIGINT is a layer, not a domain, but ground domain has cell towers
      if (!inferredDomains.includes('ground')) {
        inferredDomains.push('ground')
      }
    }
    if (preset.category === 'multi-int') {
      // Full spectrum gets all available domains
      inferredDomains.push('ground', 'surface', 'space')
    }

    // Default to ground if no domains inferred
    if (inferredDomains.length === 0) {
      inferredDomains.push('ground')
    }

    setSelectedDomains(inferredDomains)

    // Infer layers from preset configuration
    const inferredLayers: ICLayerId[] = []
    if (preset.layers.cellTowers?.enabled) {
      inferredLayers.push('cyber')
    }

    setSelectedLayers(inferredLayers)
    setActivePreset(presetId)
  }

  const handleApply = () => {
    // Apply configuration to map
    const domainLayerService = getDomainLayerService()

    // For now, apply primary domain (first selected)
    // TODO: Implement true multi-domain support
    if (selectedDomains.length > 0 && mapStore.map) {
      domainLayerService.switchDomain(selectedDomains[0], mapStore.map, {
        animateViewport: false,
        preserveUserLayers: false
      })
    }

    onApply?.(selectedDomains, selectedLayers)
    onClose?.()
  }

  const handleReset = () => {
    setSelectedDomains([initialDomain])
    setSelectedLayers(initialLayers)
    setActivePreset(null)
  }

  const presets = Object.values(INTELLIGENCE_PRESETS).slice(0, 6) // Show first 6 presets

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Intelligence Configuration</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Presets */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Quick Presets
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {presets.map(preset => (
              <PresetButton
                key={preset.id}
                preset={preset}
                isActive={activePreset === preset.id}
                onClick={() => handlePresetClick(preset.id)}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-500 uppercase">or manually configure</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Domain Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Operational Domains (Multi-select)
          </h3>
          <div className="space-y-2">
            {domains.map(domain => {
              const isSelected = selectedDomains.includes(domain.id)
              const isUnavailable = domain.status === 'unavailable'

              return (
                <label
                  key={domain.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                    }
                    ${isUnavailable ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => !isUnavailable && handleDomainToggle(domain.id)}
                    disabled={isUnavailable}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{domain.name}</span>
                      {domain.status === 'partial' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-600/20 text-yellow-400 rounded">
                          PARTIAL
                        </span>
                      )}
                      {domain.status === 'unavailable' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-600/20 text-gray-500 rounded">
                          N/A
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {domain.description}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                </label>
              )
            })}
          </div>
        </div>

        {/* Analysis Layers */}
        {compatibleLayers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              Analysis Layers (Cross-Domain)
            </h3>
            <div className="space-y-2">
              {compatibleLayers.map(layer => {
                const isSelected = selectedLayers.includes(layer.id)
                const isPartial = layer.status === 'partial'

                return (
                  <label
                    key={layer.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleLayerToggle(layer.id)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{layer.name}</span>
                        {isPartial && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-600/20 text-yellow-400 rounded">
                            PARTIAL
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {layer.description}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Active Configuration Summary */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium mb-2">Active Configuration</h3>
          <div className="space-y-1 text-sm text-gray-400">
            <div>
              <span className="font-medium text-gray-300">Domains:</span>{' '}
              {selectedDomains.map(d =>
                domains.find(domain => domain.id === d)?.name
              ).join(', ')} ({selectedDomains.length})
            </div>
            <div>
              <span className="font-medium text-gray-300">Layers:</span>{' '}
              {selectedLayers.length > 0
                ? selectedLayers.map(l =>
                    allLayers.find(layer => layer.id === l)?.name
                  ).join(', ')
                : 'None'
              } ({selectedLayers.length})
            </div>
            {activePreset && (
              <div>
                <span className="font-medium text-gray-300">Preset:</span>{' '}
                {Object.values(INTELLIGENCE_PRESETS).find(p => p.id === activePreset)?.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <button
          onClick={handleApply}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Apply Configuration
        </button>
        <button
          onClick={handleReset}
          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </button>
      </div>
    </div>
  )
}
