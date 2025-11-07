'use client'

/**
 * Domain Analysis Toolbar
 * Context-sensitive analysis controls based on active IC operational domain
 *
 * Displays domain-specific filtering and analysis tools in the right panel
 */

import React, { useState } from 'react'
import { type ICDomainId } from '@/lib/config/icDomains'
import {
  getDomainAnalysisControls,
  type AnalysisControl
} from '@/lib/config/icDomainVisualization'
import * as Icons from 'lucide-react'

interface DomainAnalysisToolbarProps {
  domainId: ICDomainId | null
  onControlChange?: (controlId: string, value: any) => void
  compact?: boolean
}

export function DomainAnalysisToolbar({
  domainId,
  onControlChange,
  compact = false
}: DomainAnalysisToolbarProps) {
  const [controlValues, setControlValues] = useState<Record<string, any>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['filters']))

  if (!domainId) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Icons.Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Select a domain to see analysis controls</p>
      </div>
    )
  }

  const controls = getDomainAnalysisControls(domainId)

  const handleControlChange = (controlId: string, value: any) => {
    setControlValues(prev => ({ ...prev, [controlId]: value }))
    onControlChange?.(controlId, value)
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const getIcon = (iconName?: string) => {
    if (!iconName) return null
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null
  }

  const renderControl = (control: AnalysisControl) => {
    const value = controlValues[control.id] ?? control.defaultValue

    switch (control.type) {
      case 'toggle':
        return (
          <label
            key={control.id}
            className="flex items-center justify-between gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getIcon(control.icon)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">
                  {control.label}
                </div>
                {control.description && !compact && (
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {control.description}
                  </div>
                )}
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleControlChange(control.id, e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
          </label>
        )

      case 'select':
        return (
          <div
            key={control.id}
            className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              {getIcon(control.icon)}
              <label className="text-sm font-medium text-gray-200">
                {control.label}
              </label>
            </div>
            <select
              value={value || control.defaultValue || ''}
              onChange={(e) => handleControlChange(control.id, e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {control.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {control.description && !compact && (
              <div className="text-xs text-gray-500 mt-2">
                {control.description}
              </div>
            )}
          </div>
        )

      case 'multi-select':
        return (
          <div
            key={control.id}
            className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              {getIcon(control.icon)}
              <label className="text-sm font-medium text-gray-200">
                {control.label}
              </label>
            </div>
            <div className="space-y-1.5">
              {control.options?.map(option => {
                const selectedValues = value || []
                const isSelected = selectedValues.includes(option.value)

                return (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...selectedValues, option.value]
                          : selectedValues.filter((v: string) => v !== option.value)
                        handleControlChange(control.id, newValue)
                      }}
                      className="w-3.5 h-3.5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">{option.label}</span>
                  </label>
                )
              })}
            </div>
            {control.description && !compact && (
              <div className="text-xs text-gray-500 mt-2">
                {control.description}
              </div>
            )}
          </div>
        )

      case 'slider':
        return (
          <div
            key={control.id}
            className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {getIcon(control.icon)}
                <label className="text-sm font-medium text-gray-200">
                  {control.label}
                </label>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {value || control.defaultValue || 1}x
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={0.5}
              value={value || control.defaultValue || 1}
              onChange={(e) => handleControlChange(control.id, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            {control.description && !compact && (
              <div className="text-xs text-gray-500 mt-2">
                {control.description}
              </div>
            )}
          </div>
        )

      case 'radius':
        return (
          <div
            key={control.id}
            className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              {getIcon(control.icon)}
              <label className="text-sm font-medium text-gray-200">
                {control.label}
              </label>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {control.options?.map(option => {
                const isSelected = value === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => handleControlChange(control.id, option.value)}
                    className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-650'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            {control.description && !compact && (
              <div className="text-xs text-gray-500 mt-2">
                {control.description}
              </div>
            )}
          </div>
        )

      case 'time-range':
        return (
          <div
            key={control.id}
            className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              {getIcon(control.icon)}
              <label className="text-sm font-medium text-gray-200">
                {control.label}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Start</label>
                <input
                  type="datetime-local"
                  className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">End</label>
                <input
                  type="datetime-local"
                  className="w-full px-2 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {control.description && !compact && (
              <div className="text-xs text-gray-500 mt-2">
                {control.description}
              </div>
            )}
          </div>
        )

      case 'custom':
        return (
          <button
            key={control.id}
            onClick={() => handleControlChange(control.id, { action: 'trigger' })}
            className="w-full flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700 transition-colors group"
          >
            {getIcon(control.icon)}
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-200">
                {control.label}
              </div>
              {control.description && !compact && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {control.description}
                </div>
              )}
            </div>
            <Icons.ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </button>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 text-gray-200">
          <Icons.Sliders className="w-5 h-5" />
          <h3 className="font-semibold">Analysis Controls</h3>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {domainId.charAt(0).toUpperCase() + domainId.slice(1)} Domain
        </p>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {controls.length > 0 ? (
          controls.map(control => renderControl(control))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Icons.Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No analysis controls available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => setControlValues({})}
          className="w-full px-3 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Icons.RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}

export default DomainAnalysisToolbar
