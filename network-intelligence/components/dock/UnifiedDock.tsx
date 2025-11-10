'use client'

/**
 * Unified Dock
 * Bottom command bar with expandable panels for Chat, Domains, Analysis, Layers
 * Only one panel active at a time, maximum map visibility
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Globe, BarChart3, Layers, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type mapboxgl from 'mapbox-gl'

// Panel mode types
export type DockMode = 'chat' | 'domains' | 'analysis' | 'layers' | null

interface DockIcon {
  id: DockMode
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
}

const DOCK_ICONS: DockIcon[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat', shortcut: '⌘K' },
  { id: 'domains', icon: Globe, label: 'Domains', shortcut: '⌘D' },
  { id: 'analysis', icon: BarChart3, label: 'Analysis', shortcut: '⌘A' },
  { id: 'layers', icon: Layers, label: 'Layers', shortcut: '⌘L' },
]

interface UnifiedDockProps {
  map: mapboxgl.Map | null
  className?: string
  onAction?: (action: string, data: any) => void
  // Panel content components
  chatPanel?: React.ReactNode
  domainsPanel?: React.ReactNode
  analysisPanel?: React.ReactNode
  layersPanel?: React.ReactNode
}

export function UnifiedDock({
  map,
  className = '',
  onAction,
  chatPanel,
  domainsPanel,
  analysisPanel,
  layersPanel,
}: UnifiedDockProps) {
  const [activeMode, setActiveMode] = useState<DockMode>(null)

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeMode) {
        setActiveMode(null)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [activeMode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault()
            setActiveMode(prev => prev === 'chat' ? null : 'chat')
            break
          case 'd':
            e.preventDefault()
            setActiveMode(prev => prev === 'domains' ? null : 'domains')
            break
          case 'a':
            e.preventDefault()
            setActiveMode(prev => prev === 'analysis' ? null : 'analysis')
            break
          case 'l':
            e.preventDefault()
            setActiveMode(prev => prev === 'layers' ? null : 'layers')
            break
        }
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const handleDockClick = (mode: DockMode) => {
    setActiveMode(prev => prev === mode ? null : mode)
  }

  const getPanelContent = () => {
    switch (activeMode) {
      case 'chat':
        return chatPanel || <div className="p-8 text-center text-gray-500">Chat panel coming soon</div>
      case 'domains':
        return domainsPanel || <div className="p-8 text-center text-gray-500">Domains panel coming soon</div>
      case 'analysis':
        return analysisPanel || <div className="p-8 text-center text-gray-500">Analysis panel coming soon</div>
      case 'layers':
        return layersPanel || <div className="p-8 text-center text-gray-500">Layers panel coming soon</div>
      default:
        return null
    }
  }

  const getPanelHeight = () => {
    switch (activeMode) {
      case 'chat':
        return '50vh'
      case 'domains':
        return '420px'
      case 'analysis':
        return '380px'
      case 'layers':
        return '340px'
      default:
        return 0
    }
  }

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 z-40', className)}>
      {/* Expanded Panel */}
      <AnimatePresence>
        {activeMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: getPanelHeight(), opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="bg-gray-900/95 backdrop-blur border-t border-gray-800 overflow-hidden"
          >
            <div className="h-full overflow-y-auto">
              {getPanelContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock Bar */}
      <div className="bg-gray-900/98 backdrop-blur border-t border-gray-800 shadow-2xl">
        <div className="flex items-center justify-center gap-1 px-4 py-2">
          {DOCK_ICONS.map((item) => {
            const Icon = item.icon
            const isActive = activeMode === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleDockClick(item.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all',
                  'hover:bg-gray-800/50',
                  isActive && 'bg-blue-600/20 text-blue-400',
                  !isActive && 'text-gray-400 hover:text-gray-200'
                )}
                title={`${item.label} ${item.shortcut || ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="dock-active"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"
                  />
                )}
              </button>
            )
          })}

          {/* Close button when panel is open */}
          {activeMode && (
            <button
              onClick={() => setActiveMode(null)}
              className="ml-2 p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
