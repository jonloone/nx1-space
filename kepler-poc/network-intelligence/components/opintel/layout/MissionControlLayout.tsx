/**
 * Mission Control Layout
 *
 * Main layout wrapper for the operations intelligence interface
 * Integrates:
 * - Main content area (map, panels)
 * - Timeline bottom popup panel
 * - Command palette bar (AI Navigator)
 */

'use client'

import React from 'react'
import { TimelineBottomPanel } from '@/components/opintel/panels/TimelineBottomPanel'
import { CommandPaletteBar } from '@/components/chat/CommandPaletteBar'
import { useTimelinePanelStore } from '@/lib/stores/timelinePanelStore'

interface MissionControlLayoutProps {
  children: React.ReactNode
  onSendAIMessage?: (message: string) => Promise<void>
}

export function MissionControlLayout({ children, onSendAIMessage }: MissionControlLayoutProps) {
  const { isOpen: isTimelineOpen } = useTimelinePanelStore()

  // Calculate bottom padding to account for command palette
  // When timeline is open, it overlays the command palette, so no extra padding needed
  const bottomPadding = isTimelineOpen ? 0 : 60

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Main Content Area */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{
          paddingBottom: `${bottomPadding}px`
        }}
      >
        {children}
      </div>

      {/* Timeline Bottom Panel (slides up when opened) */}
      <TimelineBottomPanel />

      {/* Command Palette Bar (AI Navigator at bottom) */}
      <CommandPaletteBar
        onSendMessage={onSendAIMessage}
        placeholder="Ask AI Navigator about subjects, locations, or request analysis..."
      />
    </div>
  )
}
