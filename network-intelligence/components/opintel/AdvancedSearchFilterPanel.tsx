/**
 * Advanced Search & Filter Panel
 * Federal-grade multi-faceted search and filtering system
 *
 * Features:
 * - Full-text search across alerts, events, and subjects
 * - Multi-select filters (priority, category, confidence, significance)
 * - Date range selector with presets
 * - Location radius search
 * - Tag-based filtering
 * - Saved filter presets
 * - Real-time result count
 * - Clear all filters
 * - Export search results
 */

'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  Tag,
  Save,
  Download,
  AlertTriangle,
  Clock,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  Bookmark
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { IntelligenceAlert, TimelineEvent } from '@/lib/types/chatArtifacts'

export interface AdvancedSearchFilterPanelProps {
  alerts: IntelligenceAlert[]
  events?: TimelineEvent[]
  onFilterChange?: (results: FilterResults) => void
  onClose?: () => void
  onExport?: (results: FilterResults) => void
}

export interface FilterCriteria {
  // Text search
  searchQuery: string

  // Alert filters
  priorities: Set<string>
  categories: Set<string>
  confidenceLevels: Set<string>
  actionRequired: boolean | null

  // Event filters
  significanceLevels: Set<string>
  eventTypes: Set<string>

  // Temporal filters
  dateRangeStart: Date | null
  dateRangeEnd: Date | null

  // Spatial filters
  locationQuery: string
  radiusKm: number | null

  // Tag filters
  tags: Set<string>

  // Subject filters
  subjectIds: Set<string>
  caseNumbers: Set<string>
}

export interface FilterResults {
  alerts: IntelligenceAlert[]
  events: TimelineEvent[]
  criteria: FilterCriteria
  totalResults: number
}

const DEFAULT_CRITERIA: FilterCriteria = {
  searchQuery: '',
  priorities: new Set(),
  categories: new Set(),
  confidenceLevels: new Set(),
  actionRequired: null,
  significanceLevels: new Set(),
  eventTypes: new Set(),
  dateRangeStart: null,
  dateRangeEnd: null,
  locationQuery: '',
  radiusKm: null,
  tags: new Set(),
  subjectIds: new Set(),
  caseNumbers: new Set()
}

interface SavedFilter {
  id: string
  name: string
  criteria: FilterCriteria
  timestamp: Date
}

/**
 * Advanced Search & Filter Panel Component
 */
export default function AdvancedSearchFilterPanel({
  alerts,
  events = [],
  onFilterChange,
  onClose,
  onExport
}: AdvancedSearchFilterPanelProps) {
  const [criteria, setCriteria] = useState<FilterCriteria>(DEFAULT_CRITERIA)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['search', 'alerts']))

  // Extract unique values from data
  const uniqueValues = useMemo(() => {
    const priorities = new Set(alerts.map(a => a.priority))
    const categories = new Set(alerts.map(a => a.category))
    const confidenceLevels = new Set(alerts.map(a => a.confidence))
    const significanceLevels = new Set(events.map(e => e.significance))
    const eventTypes = new Set(events.map(e => e.type))
    const tags = new Set(alerts.flatMap(a => a.tags || []))
    const subjectIds = new Set(alerts.map(a => a.subjectId))
    const caseNumbers = new Set(alerts.map(a => a.caseNumber))

    return {
      priorities: Array.from(priorities),
      categories: Array.from(categories),
      confidenceLevels: Array.from(confidenceLevels),
      significanceLevels: Array.from(significanceLevels),
      eventTypes: Array.from(eventTypes),
      tags: Array.from(tags),
      subjectIds: Array.from(subjectIds),
      caseNumbers: Array.from(caseNumbers)
    }
  }, [alerts, events])

  // Apply filters
  const filteredResults = useMemo(() => {
    let filteredAlerts = [...alerts]
    let filteredEvents = [...events]

    // Text search
    if (criteria.searchQuery) {
      const query = criteria.searchQuery.toLowerCase()
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.title.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query) ||
        alert.subjectName.toLowerCase().includes(query) ||
        alert.caseName.toLowerCase().includes(query)
      )
      filteredEvents = filteredEvents.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      )
    }

    // Priority filter
    if (criteria.priorities.size > 0) {
      filteredAlerts = filteredAlerts.filter(alert => criteria.priorities.has(alert.priority))
    }

    // Category filter
    if (criteria.categories.size > 0) {
      filteredAlerts = filteredAlerts.filter(alert => criteria.categories.has(alert.category))
    }

    // Confidence filter
    if (criteria.confidenceLevels.size > 0) {
      filteredAlerts = filteredAlerts.filter(alert => criteria.confidenceLevels.has(alert.confidence))
    }

    // Action required filter
    if (criteria.actionRequired !== null) {
      filteredAlerts = filteredAlerts.filter(alert => alert.actionRequired === criteria.actionRequired)
    }

    // Significance filter
    if (criteria.significanceLevels.size > 0) {
      filteredEvents = filteredEvents.filter(event => criteria.significanceLevels.has(event.significance))
    }

    // Event type filter
    if (criteria.eventTypes.size > 0) {
      filteredEvents = filteredEvents.filter(event => criteria.eventTypes.has(event.type))
    }

    // Date range filter
    if (criteria.dateRangeStart) {
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= criteria.dateRangeStart!)
      filteredEvents = filteredEvents.filter(event => event.timestamp >= criteria.dateRangeStart!)
    }
    if (criteria.dateRangeEnd) {
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= criteria.dateRangeEnd!)
      filteredEvents = filteredEvents.filter(event => event.timestamp <= criteria.dateRangeEnd!)
    }

    // Location search
    if (criteria.locationQuery) {
      const locationQuery = criteria.locationQuery.toLowerCase()
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.location?.name.toLowerCase().includes(locationQuery)
      )
      filteredEvents = filteredEvents.filter(event =>
        event.location?.name.toLowerCase().includes(locationQuery)
      )
    }

    // Tag filter
    if (criteria.tags.size > 0) {
      filteredAlerts = filteredAlerts.filter(alert =>
        alert.tags?.some(tag => criteria.tags.has(tag))
      )
    }

    // Subject ID filter
    if (criteria.subjectIds.size > 0) {
      filteredAlerts = filteredAlerts.filter(alert => criteria.subjectIds.has(alert.subjectId))
    }

    // Case number filter
    if (criteria.caseNumbers.size > 0) {
      filteredAlerts = filteredAlerts.filter(alert => criteria.caseNumbers.has(alert.caseNumber))
    }

    return {
      alerts: filteredAlerts,
      events: filteredEvents,
      criteria,
      totalResults: filteredAlerts.length + filteredEvents.length
    }
  }, [alerts, events, criteria])

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange?.(filteredResults)
  }, [filteredResults, onFilterChange])

  // Update criteria helpers
  const updateCriteria = useCallback((updates: Partial<FilterCriteria>) => {
    setCriteria(prev => ({ ...prev, ...updates }))
  }, [])

  const toggleSetValue = useCallback((set: Set<string>, value: string) => {
    const newSet = new Set(set)
    if (newSet.has(value)) {
      newSet.delete(value)
    } else {
      newSet.add(value)
    }
    return newSet
  }, [])

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }, [])

  // Clear all filters
  const handleClearAll = useCallback(() => {
    setCriteria(DEFAULT_CRITERIA)
  }, [])

  // Date range presets
  const handleDatePreset = useCallback((preset: string) => {
    const now = new Date()
    const start = new Date()

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'last7days':
        start.setDate(start.getDate() - 7)
        break
      case 'last30days':
        start.setDate(start.getDate() - 30)
        break
      case 'last90days':
        start.setDate(start.getDate() - 90)
        break
      default:
        return
    }

    updateCriteria({ dateRangeStart: start, dateRangeEnd: now })
  }, [updateCriteria])

  // Save current filter
  const handleSaveFilter = useCallback(() => {
    const name = window.prompt('Enter filter name:')
    if (!name) return

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      criteria: { ...criteria },
      timestamp: new Date()
    }

    setSavedFilters(prev => [...prev, newFilter])
  }, [criteria])

  // Load saved filter
  const handleLoadFilter = useCallback((filter: SavedFilter) => {
    setCriteria(filter.criteria)
  }, [])

  // Export results
  const handleExport = useCallback(() => {
    onExport?.(filteredResults)
  }, [onExport, filteredResults])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (criteria.searchQuery) count++
    count += criteria.priorities.size
    count += criteria.categories.size
    count += criteria.confidenceLevels.size
    if (criteria.actionRequired !== null) count++
    count += criteria.significanceLevels.size
    count += criteria.eventTypes.size
    if (criteria.dateRangeStart || criteria.dateRangeEnd) count++
    if (criteria.locationQuery) count++
    count += criteria.tags.size
    count += criteria.subjectIds.size
    count += criteria.caseNumbers.size
    return count
  }, [criteria])

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-bold text-gray-900">Advanced Search & Filter</h3>
          {activeFilterCount > 0 && (
            <Badge className="bg-blue-600 text-white text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Results Summary */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-blue-900">
              {filteredResults.totalResults} Results
            </div>
            <div className="text-xs text-blue-700">
              {filteredResults.alerts.length} alerts, {filteredResults.events.length} events
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveFilter}
              className="h-7 text-xs border-blue-300"
              disabled={activeFilterCount === 0}
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-7 text-xs border-blue-300"
              disabled={filteredResults.totalResults === 0}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Search Section */}
          <Collapsible
            open={expandedSections.has('search')}
            onOpenChange={() => toggleSection('search')}
          >
            <Card className="border-gray-200">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Text Search
                      </CardTitle>
                    </div>
                    {expandedSections.has('search') ? (
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Input
                    placeholder="Search alerts, events, subjects..."
                    value={criteria.searchQuery}
                    onChange={(e) => updateCriteria({ searchQuery: e.target.value })}
                    className="text-xs"
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Alert Filters */}
          <Collapsible
            open={expandedSections.has('alerts')}
            onOpenChange={() => toggleSection('alerts')}
          >
            <Card className="border-gray-200">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Alert Filters
                      </CardTitle>
                      {(criteria.priorities.size + criteria.categories.size + criteria.confidenceLevels.size) > 0 && (
                        <Badge variant="outline" className="text-xs border-gray-300">
                          {criteria.priorities.size + criteria.categories.size + criteria.confidenceLevels.size}
                        </Badge>
                      )}
                    </div>
                    {expandedSections.has('alerts') ? (
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {/* Priority */}
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">Priority</Label>
                    <div className="space-y-2">
                      {uniqueValues.priorities.map(priority => (
                        <div key={priority} className="flex items-center space-x-2">
                          <Checkbox
                            id={`priority-${priority}`}
                            checked={criteria.priorities.has(priority)}
                            onCheckedChange={() =>
                              updateCriteria({ priorities: toggleSetValue(criteria.priorities, priority) })
                            }
                          />
                          <label
                            htmlFor={`priority-${priority}`}
                            className="text-xs text-gray-700 capitalize cursor-pointer"
                          >
                            {priority}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Category */}
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">Category</Label>
                    <div className="space-y-2">
                      {uniqueValues.categories.map(category => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={criteria.categories.has(category)}
                            onCheckedChange={() =>
                              updateCriteria({ categories: toggleSetValue(criteria.categories, category) })
                            }
                          />
                          <label
                            htmlFor={`category-${category}`}
                            className="text-xs text-gray-700 capitalize cursor-pointer"
                          >
                            {category.replace('-', ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Confidence */}
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">Confidence</Label>
                    <div className="space-y-2">
                      {uniqueValues.confidenceLevels.map(confidence => (
                        <div key={confidence} className="flex items-center space-x-2">
                          <Checkbox
                            id={`confidence-${confidence}`}
                            checked={criteria.confidenceLevels.has(confidence)}
                            onCheckedChange={() =>
                              updateCriteria({ confidenceLevels: toggleSetValue(criteria.confidenceLevels, confidence) })
                            }
                          />
                          <label
                            htmlFor={`confidence-${confidence}`}
                            className="text-xs text-gray-700 capitalize cursor-pointer"
                          >
                            {confidence}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Action Required */}
                  <div>
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">Action Required</Label>
                    <Select
                      value={criteria.actionRequired === null ? 'all' : criteria.actionRequired ? 'yes' : 'no'}
                      onValueChange={(v) =>
                        updateCriteria({ actionRequired: v === 'all' ? null : v === 'yes' })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Event Filters */}
          {events.length > 0 && (
            <Collapsible
              open={expandedSections.has('events')}
              onOpenChange={() => toggleSection('events')}
            >
              <Card className="border-gray-200">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <CardTitle className="text-sm font-semibold text-gray-700">
                          Event Filters
                        </CardTitle>
                        {(criteria.significanceLevels.size + criteria.eventTypes.size) > 0 && (
                          <Badge variant="outline" className="text-xs border-gray-300">
                            {criteria.significanceLevels.size + criteria.eventTypes.size}
                          </Badge>
                        )}
                      </div>
                      {expandedSections.has('events') ? (
                        <ChevronUp className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    {/* Significance */}
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 mb-2 block">Significance</Label>
                      <div className="space-y-2">
                        {uniqueValues.significanceLevels.map(significance => (
                          <div key={significance} className="flex items-center space-x-2">
                            <Checkbox
                              id={`significance-${significance}`}
                              checked={criteria.significanceLevels.has(significance)}
                              onCheckedChange={() =>
                                updateCriteria({
                                  significanceLevels: toggleSetValue(criteria.significanceLevels, significance)
                                })
                              }
                            />
                            <label
                              htmlFor={`significance-${significance}`}
                              className="text-xs text-gray-700 capitalize cursor-pointer"
                            >
                              {significance}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Event Type */}
                    <div>
                      <Label className="text-xs font-semibold text-gray-700 mb-2 block">Event Type</Label>
                      <div className="space-y-2">
                        {uniqueValues.eventTypes.slice(0, 8).map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={`eventType-${type}`}
                              checked={criteria.eventTypes.has(type)}
                              onCheckedChange={() =>
                                updateCriteria({ eventTypes: toggleSetValue(criteria.eventTypes, type) })
                              }
                            />
                            <label
                              htmlFor={`eventType-${type}`}
                              className="text-xs text-gray-700 capitalize cursor-pointer"
                            >
                              {type.replace('-', ' ')}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Date Range */}
          <Collapsible
            open={expandedSections.has('dateRange')}
            onOpenChange={() => toggleSection('dateRange')}
          >
            <Card className="border-gray-200">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Date Range
                      </CardTitle>
                      {(criteria.dateRangeStart || criteria.dateRangeEnd) && (
                        <Badge variant="outline" className="text-xs border-gray-300">
                          Active
                        </Badge>
                      )}
                    </div>
                    {expandedSections.has('dateRange') ? (
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {/* Presets */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDatePreset('today')}
                      className="h-7 text-xs"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDatePreset('yesterday')}
                      className="h-7 text-xs"
                    >
                      Yesterday
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDatePreset('last7days')}
                      className="h-7 text-xs"
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDatePreset('last30days')}
                      className="h-7 text-xs"
                    >
                      Last 30 Days
                    </Button>
                  </div>

                  <Separator />

                  {/* Custom range */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700">Custom Range</Label>
                    <Input
                      type="datetime-local"
                      value={criteria.dateRangeStart?.toISOString().slice(0, 16) || ''}
                      onChange={(e) =>
                        updateCriteria({ dateRangeStart: e.target.value ? new Date(e.target.value) : null })
                      }
                      className="text-xs h-8"
                    />
                    <Input
                      type="datetime-local"
                      value={criteria.dateRangeEnd?.toISOString().slice(0, 16) || ''}
                      onChange={(e) =>
                        updateCriteria({ dateRangeEnd: e.target.value ? new Date(e.target.value) : null })
                      }
                      className="text-xs h-8"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Location */}
          <Collapsible
            open={expandedSections.has('location')}
            onOpenChange={() => toggleSection('location')}
          >
            <Card className="border-gray-200">
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        Location
                      </CardTitle>
                      {criteria.locationQuery && (
                        <Badge variant="outline" className="text-xs border-gray-300">
                          Active
                        </Badge>
                      )}
                    </div>
                    {expandedSections.has('location') ? (
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Input
                    placeholder="Search by location..."
                    value={criteria.locationQuery}
                    onChange={(e) => updateCriteria({ locationQuery: e.target.value })}
                    className="text-xs"
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-gray-600" />
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    Saved Filters
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {savedFilters.map(filter => (
                    <Button
                      key={filter.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadFilter(filter)}
                      className="w-full justify-start h-auto text-xs"
                    >
                      <div className="text-left">
                        <div className="font-medium">{filter.name}</div>
                        <div className="text-[10px] text-gray-500">
                          {filter.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClearAll}
          disabled={activeFilterCount === 0}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      </div>
    </div>
  )
}
