'use client'

/**
 * Context Agent Indicator
 *
 * Shows the status of the separate context monitoring agent
 * Displays thinking state when analyzing application context
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ContextAgentIndicatorProps {
  isThinking?: boolean
  status?: 'idle' | 'analyzing' | 'monitoring'
  className?: string
}

export default function ContextAgentIndicator({
  isThinking = false,
  status = 'monitoring',
  className
}: ContextAgentIndicatorProps) {
  const statusText = {
    idle: 'Ready',
    analyzing: 'Analyzing context...',
    monitoring: 'Monitoring'
  }[status]

  const statusColor = {
    idle: 'text-gray-500',
    analyzing: 'text-blue-600',
    monitoring: 'text-green-600'
  }[status]

  return (
    <div className={cn('px-3 py-2 mb-2', className)}>
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
        {/* Agent Icon */}
        <div className="relative">
          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
            <Brain className="w-4 h-4 text-blue-600" />
          </div>

          {/* Thinking Indicator */}
          {isThinking && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center"
            >
              <Loader2 className="w-2 h-2 text-white animate-spin" />
            </motion.div>
          )}
        </div>

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-gray-900">
            Context Agent
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className={cn('text-[9px] font-medium', statusColor)}
            >
              {statusText}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status Indicator Pulse */}
        {status === 'monitoring' && (
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full"
            />
          </div>
        )}

        {/* Analyzing Indicator */}
        {status === 'analyzing' && (
          <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
        )}
      </div>
    </div>
  )
}
