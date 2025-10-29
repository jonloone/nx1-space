/**
 * HorizontalAnalysisCard Component
 *
 * Horizontal scrolling analysis artifact display
 * Features:
 * - Side-by-side compact cards in horizontal scroll
 * - 280px card width (fits 3-4 cards on typical screens)
 * - Professional glassmorphism (95% opacity, blur-lg)
 * - Minimal height footprint (120px collapsed, 400px expanded)
 * - Optimized for displaying multiple alerts/profiles at once
 */

'use client'

import React, { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  User,
  Clock,
  FileText,
  Activity,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAnalysisStore, type ArtifactWithMetadata } from '@/lib/stores/analysisStore'
import ArtifactRenderer from '@/components/ai/artifacts/ArtifactRenderer'

export interface HorizontalAnalysisCardProps {
  onClose?: () => void
  className?: string
}

// Map artifact types to icons
const getArtifactIcon = (type: string) => {
  switch (type) {
    case 'intelligence-alert':
      return AlertTriangle
    case 'subject-profile':
      return User
    case 'timeline':
      return Clock
    case 'analysis':
      return Activity
    case 'location':
      return MapPin
    default:
      return FileText
  }
}

// Get artifact title from type
const getArtifactTitle = (type: string) => {
  switch (type) {
    case 'intelligence-alert':
      return 'ALERT'
    case 'subject-profile':
      return 'PROFILE'
    case 'timeline':
      return 'TIMELINE'
    case 'analysis':
      return 'ANALYSIS'
    case 'location':
      return 'LOCATION'
    default:
      return 'DATA'
  }
}

// Format timestamp
const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'Now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return date.toLocaleDateString()
}

interface HorizontalArtifactCardProps {
  artifact: ArtifactWithMetadata
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

function HorizontalArtifactCard({ artifact, onToggle, onRemove }: HorizontalArtifactCardProps) {
  const Icon = getArtifactIcon(artifact.type)
  const title = getArtifactTitle(artifact.type)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white border border-gray-200/70 rounded-lg shadow-sm hover:shadow-md transition-all shrink-0',
        artifact.isExpanded ? 'w-[400px]' : 'w-[280px]'
      )}
    >
      {/* Compact Card Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-gray-200/70">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Icon className="w-3 h-3 text-mundi-500 shrink-0" />
          <h3 className="text-[9px] font-semibold text-gray-700 uppercase tracking-wide truncate">
            {title}
          </h3>
          <span className="text-[9px] text-gray-500 shrink-0">
            {formatTimestamp(artifact.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(artifact.id)}
            className="h-5 w-5 rounded hover:bg-gray-100"
          >
            {artifact.isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(artifact.id)}
            className="h-5 w-5 rounded hover:bg-gray-100 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Card Content - Expandable */}
      <AnimatePresence initial={false}>
        {artifact.isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 360, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ScrollArea className="h-[360px]">
              <div className="p-3">
                <ArtifactRenderer artifact={artifact} />
              </div>
            </ScrollArea>
          </motion.div>
        ) : (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 70, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2.5">
              {/* Compact preview - extract key info from artifact */}
              <div className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                {artifact.data.title || artifact.data.subjectName || 'Analysis data'}
              </div>
              {artifact.data.description && (
                <div className="text-[10px] text-gray-500 line-clamp-1 mt-1">
                  {artifact.data.description}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const HorizontalAnalysisCard = forwardRef<HTMLDivElement, HorizontalAnalysisCardProps>(
  function HorizontalAnalysisCard({ onClose, className }, ref) {
    const { artifacts, toggleExpand, removeArtifact, clearArtifacts } = useAnalysisStore()
    const scrollRef = React.useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const scrollAmount = 300
        scrollRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        })
      }
    }

    return (
      <motion.div
        ref={ref}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className={cn('panel-card flex flex-col', className)}
      >
        {/* Compact Header */}
        <div className="h-12 px-3 flex items-center justify-between border-b border-gray-100 bg-white/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#176BF8] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-[#171717]">
                Analysis
              </h2>
              <p className="text-[10px] text-[#737373]">
                {artifacts.length} {artifacts.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {artifacts.length > 1 && (
              <div className="flex items-center gap-0.5 mr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll('left')}
                  className="h-7 w-7 rounded-lg hover:bg-[#F5F5F5]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scroll('right')}
                  className="h-7 w-7 rounded-lg hover:bg-[#F5F5F5]"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {artifacts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearArtifacts}
                className="h-7 px-2 text-[10px] text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 rounded-lg hover:bg-[#F5F5F5]"
                aria-label="Close Analysis"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Horizontal Scrollable Artifact Strip */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-3 p-3 overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <AnimatePresence mode="popLayout">
              {artifacts.map((artifact) => (
                <HorizontalArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  onToggle={toggleExpand}
                  onRemove={removeArtifact}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Fade gradients for scroll indication */}
          {artifacts.length > 2 && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </>
          )}
        </div>
      </motion.div>
    )
  }
)

export default HorizontalAnalysisCard
