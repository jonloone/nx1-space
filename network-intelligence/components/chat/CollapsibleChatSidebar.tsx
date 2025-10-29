/**
 * Collapsible Chat Sidebar
 *
 * Single-purpose AI chat card for masonry layout.
 *
 * Features:
 * - 420px width (independent card)
 * - Professional glassmorphism (95% opacity, blur-lg)
 * - Rounded corners and consistent spacing
 * - No absolute positioning (flex layout child)
 * - Analysis drawer is now a separate AnalysisCard component
 */

'use client'

import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CopilotSidebarWrapper from './CopilotSidebarWrapper'
import { AIChatPanelRef } from '@/components/ai/AIChatPanel'
import { cn } from '@/lib/utils'

export interface CollapsibleChatSidebarProps {
  onToggle: () => void
  onClose?: () => void
  onAction?: (action: string, data: any) => void
  className?: string
}

const CollapsibleChatSidebar = forwardRef<AIChatPanelRef, CollapsibleChatSidebarProps>(
  function CollapsibleChatSidebar(
    { onToggle, onClose, onAction, className },
    ref
  ) {
    return (
      <motion.div
        initial={{ height: 120, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn('panel-card w-[420px] flex flex-col', className)}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#176BF8] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#171717] dark:text-gray-100">
                AI Assistant
              </h2>
              <p className="text-xs text-[#737373] dark:text-gray-400">
                Citizens 360 Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Collapse Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-gray-800"
              aria-label="Collapse AI Assistant"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Close Button (optional) */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-gray-800"
                aria-label="Close AI Assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Chat Content - Full Width */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <CopilotSidebarWrapper
            ref={ref}
            onAction={onAction}
          />
        </div>
      </motion.div>
    )
  }
)

export default CollapsibleChatSidebar
