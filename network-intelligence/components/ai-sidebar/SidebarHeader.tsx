'use client'

/**
 * Sidebar Header
 *
 * Shows AI status, provides collapse/expand control
 */

import React from 'react'
import { motion } from 'framer-motion'
import { PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NexusOneIcon from '@/components/branding/NexusOneIcon'
import NexusOneLogo from '@/components/branding/NexusOneLogo'

export interface SidebarHeaderProps {
  isCollapsed: boolean
  onToggle: () => void
  className?: string
}

export default function SidebarHeader({
  isCollapsed,
  onToggle,
  className
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'h-[60px] border-b border-gray-200',
        'flex items-center',
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4',
        className
      )}
    >
      {/* NexusOne Logo */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center px-2"
        >
          <NexusOneLogo width={140} height={26} className="text-[#080C16]" />
        </motion.div>
      )}

      {/* Collapsed Icon */}
      {isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center"
        >
          <NexusOneIcon size={24} />
        </motion.div>
      )}

      {/* Collapse/Expand Button */}
      {!isCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 rounded hover:bg-gray-100"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4 text-gray-600" />
        </Button>
      )}
    </div>
  )
}
