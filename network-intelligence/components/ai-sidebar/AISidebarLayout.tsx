'use client'

/**
 * AI Sidebar Layout
 *
 * Persistent left sidebar (420px) that acts as an AI copilot navigator.
 * Provides context-aware assistance, quick actions, and chat interface.
 */

import React, { useState, useEffect, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AIChatPanelRef } from '@/components/ai/AIChatPanel'
import SidebarHeader from './SidebarHeader'
import ChatHistoryView from './ChatHistoryView'

export interface AISidebarLayoutProps {
  className?: string
  onCollapse?: (collapsed: boolean) => void
  defaultCollapsed?: boolean
  onAction?: (action: string, data: any) => void
}

const AISidebarLayout = forwardRef<AIChatPanelRef, AISidebarLayoutProps>(
  function AISidebarLayout(
    { className, onCollapse, defaultCollapsed = false, onAction },
    ref
  ) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [contextAgentThinking, setContextAgentThinking] = useState(false)

  const handleToggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    onCollapse?.(newState)
  }

  // Keyboard shortcut: Cmd/Ctrl + L to focus sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault()
        if (isCollapsed) {
          setIsCollapsed(false)
          onCollapse?.(false)
        }
        // Focus chat input
        const input = document.querySelector('#ai-chat-input') as HTMLInputElement
        if (input) {
          input.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed, onCollapse])

  return (
    <motion.aside
      initial={{ width: defaultCollapsed ? 60 : 420 }}
      animate={{ width: isCollapsed ? 60 : 420 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'relative h-full flex flex-col',
        'bg-white',
        'border-r border-gray-200',
        'shadow-[4px_0_24px_rgba(0,0,0,0.12)]',
        'z-20', // Elevated above panel
        className
      )}
    >
      {/* Header */}
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggle={handleToggleCollapse}
      />

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Chat History & Input */}
            <div className="flex-1 flex flex-col overflow-hidden border-t border-gray-100 mt-3 pb-16">
              <ChatHistoryView ref={ref} onAction={onAction} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed State: Icon Bar */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center gap-4 pt-4"
          >
            {/* TODO: Add collapsed state icons */}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
)

export default AISidebarLayout
