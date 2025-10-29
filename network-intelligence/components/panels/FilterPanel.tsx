/**
 * FilterPanel Component
 *
 * Data filtering panel for intelligence data
 * Features:
 * - Priority filter (Critical, High, Medium, Low)
 * - Category filters (Alerts, Subjects, Locations, etc.)
 * - Confidence level filter
 * - Search/keyword filtering
 * - Active filter count indicator
 * - Clear all filters
 */

'use client'

import React, { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'
import {
  Filter,
  X,
  Search,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export interface FilterPanelProps {
  onClose?: () => void
  onFilterChange?: (filters: FilterState) => void
  className?: string
}

export interface FilterState {
  priorities: string[]
  categories: string[]
  confidenceMin: number
  searchQuery: string
}

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700' },
  { value: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-700' },
  { value: 'low', label: 'Low', color: 'bg-blue-500', textColor: 'text-blue-700' }
]

const CATEGORY_OPTIONS = [
  { value: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { value: 'subjects', label: 'Subjects', icon: User },
  { value: 'locations', label: 'Locations', icon: MapPin },
  { value: 'events', label: 'Events', icon: Calendar }
]

const CONFIDENCE_LEVELS = [
  { value: 0, label: 'Any' },
  { value: 25, label: 'Low' },
  { value: 50, label: 'Medium' },
  { value: 75, label: 'High' },
  { value: 90, label: 'Very High' }
]

const FilterPanel = forwardRef<HTMLDivElement, FilterPanelProps>(
  function FilterPanel({ onClose, onFilterChange, className }, ref) {
    const [priorities, setPriorities] = useState<string[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [confidenceMin, setConfidenceMin] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

    const togglePriority = (priority: string) => {
      const newPriorities = priorities.includes(priority)
        ? priorities.filter((p) => p !== priority)
        : [...priorities, priority]
      setPriorities(newPriorities)
      onFilterChange?.({ priorities: newPriorities, categories, confidenceMin, searchQuery })
    }

    const toggleCategory = (category: string) => {
      const newCategories = categories.includes(category)
        ? categories.filter((c) => c !== category)
        : [...categories, category]
      setCategories(newCategories)
      onFilterChange?.({ priorities, categories: newCategories, confidenceMin, searchQuery })
    }

    const handleConfidenceChange = (values: number[]) => {
      setConfidenceMin(values[0])
      onFilterChange?.({ priorities, categories, confidenceMin: values[0], searchQuery })
    }

    const handleSearchChange = (query: string) => {
      setSearchQuery(query)
      onFilterChange?.({ priorities, categories, confidenceMin, searchQuery: query })
    }

    const clearAllFilters = () => {
      setPriorities([])
      setCategories([])
      setConfidenceMin(0)
      setSearchQuery('')
      onFilterChange?.({ priorities: [], categories: [], confidenceMin: 0, searchQuery: '' })
    }

    const activeFilterCount =
      priorities.length +
      categories.length +
      (confidenceMin > 0 ? 1 : 0) +
      (searchQuery ? 1 : 0)

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn('panel-card w-[320px] flex flex-col', className)}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#176BF8] flex items-center justify-center relative">
              <Filter className="w-4 h-4 text-white" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Data Filters
              </h2>
              <p className="text-xs text-[#737373]">
                {activeFilterCount > 0
                  ? `${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`
                  : 'No filters applied'}
              </p>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5]"
              aria-label="Close Filter Panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Search */}
          <div>
            <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide mb-2 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
              <Input
                type="text"
                placeholder="Search by keyword..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-10 bg-white border-gray-200"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717]"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide mb-3 block">
              Priority
            </label>
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = priorities.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => togglePriority(option.value)}
                    className={cn(
                      'w-full h-10 px-3 rounded-lg border transition-all flex items-center justify-between',
                      isSelected
                        ? 'bg-[#176BF8]/10 border-[#176BF8] shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-[#F5F5F5]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-2.5 h-2.5 rounded-full', option.color)} />
                      <span className={cn('text-sm font-medium', option.textColor)}>
                        {option.label}
                      </span>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-[#176BF8]" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide mb-3 block">
              Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((option) => {
                const isSelected = categories.includes(option.value)
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleCategory(option.value)}
                    className={cn(
                      'h-16 px-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-1',
                      isSelected
                        ? 'bg-[#176BF8] border-[#176BF8] text-white shadow-md'
                        : 'bg-white border-gray-200 hover:bg-[#F5F5F5] text-[#525252]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Confidence Level */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide">
                Min. Confidence
              </label>
              <span className="text-xs font-mono text-[#525252] bg-[#F5F5F5] px-2 py-0.5 rounded">
                {confidenceMin}%
              </span>
            </div>

            <Slider
              value={[confidenceMin]}
              onValueChange={handleConfidenceChange}
              min={0}
              max={100}
              step={5}
              className="w-full mb-2"
            />

            <div className="flex justify-between">
              {CONFIDENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleConfidenceChange([level.value])}
                  className={cn(
                    'text-[9px] px-2 py-1 rounded transition-colors',
                    confidenceMin === level.value
                      ? 'bg-[#176BF8] text-white font-semibold'
                      : 'text-[#737373] hover:bg-[#F5F5F5]'
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="bg-[#F5F5F5] rounded-lg p-3 border border-[#E5E5E5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-[#171717] uppercase tracking-wide">
                  Active Filters
                </span>
                <span className="text-xs font-bold text-[#176BF8]">
                  {activeFilterCount}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {priorities.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#525252] rounded border border-[#E5E5E5]"
                  >
                    {PRIORITY_OPTIONS.find((o) => o.value === p)?.label}
                  </span>
                ))}
                {categories.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#525252] rounded border border-[#E5E5E5]"
                  >
                    {CATEGORY_OPTIONS.find((o) => o.value === c)?.label}
                  </span>
                ))}
                {confidenceMin > 0 && (
                  <span className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#525252] rounded border border-[#E5E5E5]">
                    ≥{confidenceMin}% confidence
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#525252] rounded border border-[#E5E5E5]">
                    "{searchQuery}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-4 bg-[#FAFAFA]/50">
          <Button
            variant="outline"
            className="w-full h-10 bg-white hover:bg-[#F5F5F5] border-[#E5E5E5] text-sm font-medium"
            onClick={clearAllFilters}
            disabled={activeFilterCount === 0}
          >
            <XCircle className="w-3.5 h-3.5 mr-2" />
            Clear All Filters
          </Button>
        </div>
      </motion.div>
    )
  }
)

export default FilterPanel
