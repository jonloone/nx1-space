/**
 * Timeline Bottom Panel
 *
 * Full-width panel that slides up from bottom to display temporal analysis
 * Uses Framer Motion for smooth animations
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minimize2, Maximize2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HorizontalTimeline } from '@/components/investigation/HorizontalTimeline'
import { useTimelinePanelStore } from '@/lib/stores/timelinePanelStore'

export function TimelineBottomPanel() {
  const {
    isOpen,
    isMinimized,
    events,
    subjectName,
    title,
    closeTimeline,
    toggleMinimize
  } = useTimelinePanelStore()

  // Don't render if not open
  if (!isOpen) return null

  const panelHeight = isMinimized ? 60 : 500
  const contentHeight = panelHeight - 60 // Subtract header height

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300
        }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-2xl z-40"
        style={{ height: `${panelHeight}px` }}
      >
        {/* Header */}
        <div className="h-[60px] px-6 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {title || 'Timeline Analysis'}
              </h3>
              {subjectName && (
                <p className="text-xs text-gray-600">
                  {subjectName} • {events.length} event{events.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimize/Maximize Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMinimize}
              className="h-8 w-8 hover:bg-gray-100"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-gray-900" />
              ) : (
                <Minimize2 className="w-4 h-4 text-gray-900" />
              )}
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeTimeline}
              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content - Only show when not minimized */}
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="overflow-y-auto bg-gray-50/50"
            style={{ height: `${contentHeight}px` }}
          >
            <div className="p-6">
              {events.length > 0 ? (
                <div className="flex items-center justify-center">
                  <HorizontalTimeline
                    events={events}
                    subjectName={subjectName || undefined}
                    width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 100, 1400) : 1200}
                    height={contentHeight - 48}
                    onEventClick={(event) => {
                      console.log('Timeline event clicked:', event)
                      // TODO: Could open event detail modal or highlight on map
                    }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-medium">No timeline events available</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
