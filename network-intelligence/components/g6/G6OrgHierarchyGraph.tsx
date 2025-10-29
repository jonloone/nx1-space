/**
 * G6 Organization Hierarchy Graph Component
 *
 * Visualizes organizational structure and reporting relationships
 * Uses tree layout for clear hierarchy visualization
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, Download, Filter, Users, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useG6Graph } from '@/lib/g6/hooks/useG6Graph'
import {
  type OrgMember,
  type OrgRelationship,
  transformOrgHierarchyToG6,
  filterByDepartment,
  filterByLevel,
  getOrgStats,
  findDirectReports
} from '@/lib/g6/utils/orgHierarchyTransform'
import { DAGRE_LAYOUT } from '@/lib/g6/config/layouts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

export interface G6OrgHierarchyGraphProps {
  members: OrgMember[]
  relationships?: OrgRelationship[]
  width?: number
  height?: number
  onMemberClick?: (member: OrgMember) => void
  className?: string
}

export function G6OrgHierarchyGraph({
  members,
  relationships,
  width = 800,
  height = 600,
  onMemberClick,
  className
}: G6OrgHierarchyGraphProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<number[]>([])
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB') // Top-bottom or Left-right

  // Transform to G6 format
  const baseGraphData = useMemo(() => {
    return transformOrgHierarchyToG6(members, relationships)
  }, [members, relationships])

  // Apply filters
  const graphData = useMemo(() => {
    let filtered = baseGraphData

    if (selectedDepartments.length > 0) {
      filtered = filterByDepartment(filtered, selectedDepartments)
    }

    if (selectedLevels.length > 0) {
      filtered = filterByLevel(filtered, selectedLevels)
    }

    return filtered
  }, [baseGraphData, selectedDepartments, selectedLevels])

  // Tree layout for hierarchy
  const layout = useMemo(() => {
    return {
      ...DAGRE_LAYOUT,
      rankdir: layoutDirection,
      ranksep: layoutDirection === 'TB' ? 80 : 120,
      nodesep: layoutDirection === 'TB' ? 60 : 80,
      align: 'DL' // Down-left alignment
    }
  }, [layoutDirection])

  // Initialize G6 graph
  const graph = useG6Graph({
    data: graphData,
    layout,
    width,
    height,
    fitView: true,
    animate: true,
    onNodeClick: (model) => {
      const originalData = (model as any).originalData as OrgMember
      if (originalData) {
        setSelectedMemberId(model.id as string)
        graph.selectNode(model.id as string)
        onMemberClick?.(originalData)

        // Highlight direct reports
        graph.highlightNeighbors(model.id as string)
      }
    },
    onCanvasClick: () => {
      if (selectedMemberId) {
        graph.unselectNode(selectedMemberId)
        graph.clearHighlight()
        setSelectedMemberId(null)
      }
    }
  })

  // Calculate statistics
  const stats = useMemo(() => {
    return getOrgStats(members)
  }, [members])

  // Get unique departments and levels
  const departments = useMemo(() => {
    return Array.from(new Set(members.map(m => m.department))).sort()
  }, [members])

  const levels = useMemo(() => {
    return Array.from(new Set(members.map(m => m.level))).sort()
  }, [members])

  // Get selected member info
  const selectedMember = useMemo(() => {
    return members.find(m => m.id === selectedMemberId)
  }, [selectedMemberId, members])

  const selectedMemberReports = useMemo(() => {
    if (!selectedMemberId) return []
    return findDirectReports(selectedMemberId, members)
  }, [selectedMemberId, members])

  // Toggle filters
  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev =>
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    )
  }

  const toggleLevel = (level: number) => {
    setSelectedLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    )
  }

  const clearFilters = () => {
    setSelectedDepartments([])
    setSelectedLevels([])
  }

  const handleFitView = () => {
    graph.fitView()
  }

  const handleZoomIn = () => {
    graph.zoomIn()
  }

  const handleZoomOut = () => {
    graph.zoomOut()
  }

  const handleDownload = () => {
    graph.downloadImage(`org-hierarchy-${Date.now()}`)
  }

  const toggleLayout = () => {
    setLayoutDirection(prev => prev === 'TB' ? 'LR' : 'TB')
  }

  const hasFilters = selectedDepartments.length > 0 || selectedLevels.length > 0

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return 'Executive'
      case 2: return 'Senior'
      case 3: return 'Mid-level'
      case 4: return 'Junior'
      default: return `Level ${level}`
    }
  }

  return (
    <div className={className}>
      {/* Graph Container */}
      <div
        ref={graph.containerRef}
        className="relative bg-gray-50/30 rounded-lg border border-gray-200 overflow-hidden"
        style={{ width, height }}
      />

      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        {/* Layout Toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleLayout}
          className="h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
          title="Toggle Layout Direction"
        >
          <Building className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-xs font-medium">{layoutDirection === 'TB' ? 'Vertical' : 'Horizontal'}</span>
        </Button>

        {/* Filter Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className={`h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm ${hasFilters ? 'border-2 border-purple-500' : ''}`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs font-medium">
                {hasFilters ? `Filtered` : 'Filter'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">Department</DropdownMenuLabel>
            {departments.map(dept => (
              <DropdownMenuItem
                key={dept}
                onClick={() => toggleDepartment(dept)}
                className="cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(dept)}
                  readOnly
                  className="mr-2"
                />
                <span>{dept}</span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs">Level</DropdownMenuLabel>
            {levels.map(level => (
              <DropdownMenuItem
                key={level}
                onClick={() => toggleLevel(level)}
                className="cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedLevels.includes(level)}
                  readOnly
                  className="mr-2"
                />
                <span>{getLevelLabel(level)}</span>
              </DropdownMenuItem>
            ))}

            {hasFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearFilters}
                  className="cursor-pointer text-xs text-red-600"
                >
                  Clear All Filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-7 w-7 hover:bg-gray-100"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-7 w-7 hover:bg-gray-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFitView}
            className="h-7 w-7 hover:bg-gray-100"
            title="Fit to View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Export Button */}
        <Button
          variant="secondary"
          size="icon"
          onClick={handleDownload}
          className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
          title="Download as Image"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Statistics Panel */}
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">
          Organization
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Users className="w-3 h-3 text-blue-600" />
            <span className="text-gray-700">{stats.totalMembers} members</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Building className="w-3 h-3 text-purple-600" />
            <span className="text-gray-700">{Object.keys(stats.deptCounts).length} departments</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-purple-600" />
            <span className="text-gray-700">{stats.levelCounts[1] || 0} executives</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-0.5 bg-blue-500" />
            <span className="text-gray-700">{stats.avgReportsPerManager} avg reports</span>
          </div>
        </div>
      </div>

      {/* Selected Member Info */}
      {selectedMember && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-lg max-w-xs"
        >
          <div className="text-xs font-semibold text-gray-900 mb-1">{selectedMember.name}</div>
          <div className="text-[10px] text-gray-600 mb-1">{selectedMember.title}</div>
          <div className="text-[10px] text-gray-500">{selectedMember.department}</div>
          {selectedMemberReports.length > 0 && (
            <div className="text-[10px] text-gray-500 mt-1 pt-1 border-t border-gray-200">
              {selectedMemberReports.length} direct report{selectedMemberReports.length !== 1 ? 's' : ''}
            </div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1.5">Levels</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-3 rounded bg-purple-600 border border-purple-700" />
            <span className="text-gray-700">Executive</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-3 rounded bg-blue-500 border border-blue-600" />
            <span className="text-gray-700">Senior</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-3 rounded bg-emerald-500 border border-emerald-600" />
            <span className="text-gray-700">Mid-level</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-3 rounded bg-gray-500 border border-gray-600" />
            <span className="text-gray-700">Junior</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!selectedMemberId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/90 backdrop-blur-sm rounded px-3 py-1.5 border border-gray-200 shadow-sm"
        >
          Reporting flows {layoutDirection === 'TB' ? 'top to bottom' : 'left to right'} • Click for details
        </motion.div>
      )}

      {/* Loading State */}
      {!graph.isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
          <div className="text-sm text-gray-600 font-medium">Loading organization chart...</div>
        </div>
      )}
    </div>
  )
}
