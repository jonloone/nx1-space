'use client'

import React from 'react'
import { X, Minus, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePanelStore, type PanelDetent } from '@/lib/stores/panelStore'
import PanelRouter from './PanelRouter'

/**
 * SimpleBottomPanel - A simple CSS-based bottom panel without complex animations
 * Uses Tailwind classes and CSS transitions for reliable positioning
 */
export default function SimpleBottomPanel() {
  const { isOpen, detent, closePanel, setDetent } = usePanelStore()

  if (!isOpen) {
    return null
  }

  // Calculate height based on detent
  const getHeightClass = () => {
    switch (detent) {
      case 'collapsed':
        return 'h-[20vh]'
      case 'medium':
        return 'h-[50vh]'
      case 'expanded':
        return 'h-[85vh]'
      default:
        return 'h-0'
    }
  }

  console.log('🎨 SimpleBottomPanel rendering - isOpen:', isOpen, 'detent:', detent)

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-2xl rounded-t-2xl transition-all duration-300 ease-out ${getHeightClass()}`}
      style={{ zIndex: 1001 }}
    >
      {/* Header with drag handle and controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        {/* Left side - empty for balance */}
        <div className="w-24" />

        {/* Center - drag handle */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {detent === 'collapsed' && 'Collapsed'}
            {detent === 'medium' && 'Medium'}
            {detent === 'expanded' && 'Expanded'}
          </span>
        </div>

        {/* Right side - controls */}
        <div className="flex items-center gap-2">
          {detent !== 'collapsed' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDetent('collapsed')}
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
          {detent === 'collapsed' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDetent('medium')}
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          {detent === 'medium' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDetent('expanded')}
              className="h-8 w-8"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-64px)] overflow-y-auto">
        <PanelRouter />
      </div>
    </div>
  )
}
