'use client'

/**
 * Dock Chat Panel
 * Simplified chat interface for the unified dock
 */

import { forwardRef } from 'react'
import CopilotSidebarWrapper from '@/components/chat/CopilotSidebarWrapper'
import { AIChatPanelRef } from '@/components/ai/AIChatPanel'

interface DockChatPanelProps {
  onAction?: (action: string, data: any) => void
}

export const DockChatPanel = forwardRef<AIChatPanelRef, DockChatPanelProps>(
  function DockChatPanel({ onAction }, ref) {
    return (
      <div className="h-full flex flex-col bg-gray-900">
        <CopilotSidebarWrapper
          ref={ref}
          onAction={onAction}
          className="flex-1"
        />
      </div>
    )
  }
)
