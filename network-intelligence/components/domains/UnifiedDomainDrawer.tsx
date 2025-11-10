'use client'

/**
 * Unified Domain Drawer
 * Single bottom drawer for ALL domain management (Ground, Maritime, Space, etc.)
 * Supports multi-domain fusion via domainLayerService
 */

import { useState } from 'react'
import { ChevronUp, ChevronDown, Check, Globe } from 'lucide-react'
import { getAllICDomains, type ICDomainId } from '@/lib/config/icDomains'
import { PresetButton } from '@/components/opintel/presets/PresetButton'
import { INTELLIGENCE_PRESETS } from '@/lib/config/intelligencePresets'
import { useMapStore } from '@/lib/stores/mapStore'
import { getDomainLayerService } from '@/lib/services/domainLayerService'
import { LayerManager } from '@/components/space/shared/LayerManager'

interface UnifiedDomainDrawerProps {
  className?: string
  onDomainsChange?: (domains: ICDomainId[]) => void
}

export function UnifiedDomainDrawer({ className = '', onDomainsChange }: UnifiedDomainDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'domains' | 'layers'>('domains')
  const [selectedDomains, setSelectedDomains] = useState<ICDomainId[]>(['ground'])
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const mapStore = useMapStore()
  const domains = getAllICDomains()
  const presets = Object.values(INTELLIGENCE_PRESETS).slice(0, 6)

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
    setActivePreset(null)
  }

  const handlePresetClick = (presetId: string) => {
    const presetKey = presetId.toUpperCase().replace(/-/g, '_')
    const preset = INTELLIGENCE_PRESETS[presetKey]
    if (!preset) return

    // Infer domains from preset
    const inferredDomains: ICDomainId[] = []
    if (preset.intelFocus.domains.includes('GEOINT')) {
      inferredDomains.push('ground')
    }
    if (preset.category === 'multi-int') {
      inferredDomains.push('ground', 'surface', 'space')
    }
    if (inferredDomains.length === 0) {
      inferredDomains.push('ground')
    }

    setSelectedDomains(inferredDomains)
    setActivePreset(presetId)
  }

  const handleApply = () => {
    const domainLayerService = getDomainLayerService()
    if (selectedDomains.length > 0 && mapStore.map) {
      domainLayerService.switchMultipleDomains(selectedDomains, mapStore.map, {
        animateViewport: false,
        preserveUserLayers: false
      })
      console.log(`[DomainDrawer] Applied ${selectedDomains.length} domain(s): [${selectedDomains.join(', ')}]`)

      // Notify parent of domain change
      if (onDomainsChange) {
        onDomainsChange(selectedDomains)
      }
    }
    setIsExpanded(false)
  }

  // Get domain icons
  const getDomainIcon = (domainId: ICDomainId) => {
    const icons: Record<ICDomainId, string> = {
      ground: '🌍',
      maritime: '⚓',
      space: '🛰️',
      surface: '🏔️',
      air: '✈️',
      subsurface: '⛏️'
    }
    return icons[domainId] || '📍'
  }

  if (!isExpanded) {
    // Minimized bar
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-35 ${className}`}>
        <div className="bg-gray-900/95 backdrop-blur border-t border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400" />
              <div className="flex items-center gap-2">
                {selectedDomains.map(domainId => {
                  const domain = domains.find(d => d.id === domainId)
                  return (
                    <div
                      key={domainId}
                      className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/50 rounded text-sm font-medium text-blue-300 flex items-center gap-1.5"
                    >
                      <span>{getDomainIcon(domainId)}</span>
                      <span>{domain?.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              title="Expand domain configuration"
            >
              <ChevronUp className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Expanded drawer
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-35 ${className}`}>
      <div className="bg-gray-900/95 backdrop-blur border-t border-gray-800" style={{ height: '400px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Operational Domains</h2>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            title="Minimize"
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900/50">
          <button
            onClick={() => setActiveTab('domains')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'domains'
                ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            Domains
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'layers'
                ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            Layers
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ height: 'calc(400px - 48px - 40px - 60px)' }}>
          {activeTab === 'domains' ? (
            <div className="p-4 space-y-4">
              {/* Quick Presets */}
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
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

              {/* Domain Selection */}
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Select Domains (Multi-select)
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {domains.map(domain => {
                    const isSelected = selectedDomains.includes(domain.id)
                    const isUnavailable = domain.status === 'unavailable'

                    return (
                      <label
                        key={domain.id}
                        className={`
                          flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{getDomainIcon(domain.id)}</span>
                            <span className="text-sm font-medium text-white truncate">{domain.name}</span>
                          </div>
                          {domain.status === 'partial' && (
                            <span className="text-[10px] text-yellow-400">PARTIAL</span>
                          )}
                          {domain.status === 'unavailable' && (
                            <span className="text-[10px] text-gray-500">N/A</span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <LayerManager />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900/95">
          <button
            onClick={handleApply}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Apply Domain Configuration
          </button>
        </div>
      </div>
    </div>
  )
}
