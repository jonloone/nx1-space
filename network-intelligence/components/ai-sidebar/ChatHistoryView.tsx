'use client'

/**
 * Chat History View
 *
 * Embeds the CopilotSidebarWrapper for chat functionality within the AI sidebar
 */

import React, { forwardRef } from 'react'
import { AIChatPanelRef } from '@/components/ai/AIChatPanel'
import CopilotSidebarWrapper from '@/components/chat/CopilotSidebarWrapper'

export interface ChatHistoryViewProps {
  className?: string
  onAction?: (action: string, data: any) => void
}

const ChatHistoryView = forwardRef<AIChatPanelRef, ChatHistoryViewProps>(
  function ChatHistoryView({ className, onAction }, ref) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Embedded Chat Interface */}
        <CopilotSidebarWrapper
          ref={ref}
          onAction={onAction}
        />
      </div>
    )
  }
)

export default ChatHistoryView
