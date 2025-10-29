'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  User,
  Clock,
  FileText,
  Activity,
  MapPin
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useAnalysisStore, type ArtifactWithMetadata } from '@/lib/stores/analysisStore'
import ArtifactRenderer from '@/components/ai/artifacts/ArtifactRenderer'

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
      return 'INTELLIGENCE ALERT'
    case 'subject-profile':
      return 'SUBJECT PROFILE'
    case 'timeline':
      return 'TIMELINE ANALYSIS'
    case 'analysis':
      return 'INTELLIGENCE ANALYSIS'
    case 'location':
      return 'LOCATION DATA'
    default:
      return 'ANALYSIS'
  }
}

// Format timestamp
const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

interface ArtifactCardProps {
  artifact: ArtifactWithMetadata
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

function ArtifactCard({ artifact, onToggle, onRemove }: ArtifactCardProps) {
  const Icon = getArtifactIcon(artifact.type)
  const title = getArtifactTitle(artifact.type)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200/70 rounded-lg shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200/70">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-mundi-500 shrink-0" />
            <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <span className="text-[10px] text-gray-500">
            {formatTimestamp(artifact.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggle(artifact.id)}
            className="h-6 w-6 rounded hover:bg-gray-100"
          >
            {artifact.isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(artifact.id)}
            className="h-6 w-6 rounded hover:bg-gray-100 hover:text-red-500"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Card Content - Expandable */}
      <AnimatePresence initial={false}>
        {artifact.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              <ArtifactRenderer artifact={artifact} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AnalysisDrawer() {
  const { artifacts, toggleExpand, removeArtifact, clearArtifacts } = useAnalysisStore()

  if (artifacts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center">
          <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">
            No analysis data yet
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Artifacts will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white/40">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Analysis
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {artifacts.length} {artifacts.length === 1 ? 'item' : 'items'}
            </p>
          </div>
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
        </div>
      </div>

      {/* Scrollable Artifact Stack */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                onToggle={toggleExpand}
                onRemove={removeArtifact}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
