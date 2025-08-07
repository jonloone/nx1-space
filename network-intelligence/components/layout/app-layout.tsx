'use client'

import React, { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Settings, Menu, X } from 'lucide-react'
import { GlassInput, GlassButton, GlassPanel } from '@/components/ui/glass-components'
import { BottomNavigation, NavigationMode } from './bottom-navigation'
import { FloatingMetrics } from '@/components/metrics/floating-metrics'
import { cn } from '@/lib/utils'

export interface AppLayoutProps {
  children: ReactNode
  className?: string
  showMetrics?: boolean
  defaultMode?: NavigationMode
  currentMode?: NavigationMode
  onModeChange?: (mode: NavigationMode) => void
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className,
  showMetrics = true,
  defaultMode = 'opportunities',
  currentMode: controlledMode,
  onModeChange
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [internalMode, setInternalMode] = useState<NavigationMode>(defaultMode)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Use controlled mode if provided, otherwise use internal state
  const currentMode = controlledMode !== undefined ? controlledMode : internalMode

  const handleModeChange = (mode: NavigationMode) => {
    if (controlledMode === undefined) {
      setInternalMode(mode)
    }
    onModeChange?.(mode)
    setShowMobileMenu(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality here
      console.log('Searching for:', searchQuery)
    }
  }

  return (
    <div className={cn('relative w-full h-screen overflow-hidden bg-slate-950', className)}>
      {/* Full-screen map background */}
      <div className="absolute inset-0 z-0">
        {children}
      </div>

      {/* Top Header - Centered and Compact */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-40 flex justify-center px-4 py-3"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Centered container with max width */}
        <div className="w-full max-w-3xl">
          <GlassPanel className="px-4 py-2" blur="xl" opacity="high">
            <div className="flex items-center justify-between">
              {/* Left: Compact Brand */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">GS</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-white text-sm font-medium">Ground Station Intel</h1>
                  <p className="text-gray-400 text-xs">Maritime & Satellite</p>
                </div>
              </div>
              
              {/* Center: Search Bar */}
              <div className="flex-1 max-w-md mx-4">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search stations, satellites, vessels..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className="w-full px-3 py-1.5 pl-8 text-xs text-white placeholder-gray-500 
                               bg-white/5 backdrop-blur-xl border border-white/10 rounded-full
                               focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white/10
                               transition-all duration-200"
                    />
                  </div>
                  
                  {/* Search suggestions overlay */}
                  <AnimatePresence>
                    {isSearchFocused && searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 w-full z-50"
                      >
                        <GlassPanel className="p-2" blur="lg" opacity="high">
                          <div className="space-y-1">
                            <div className="px-3 py-1 text-xs text-white/60">Recent searches</div>
                            <div className="px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded cursor-pointer">
                              Maritime coverage zones
                            </div>
                            <div className="px-3 py-1.5 text-xs text-white hover:bg-white/10 rounded cursor-pointer">
                              High opportunity regions
                            </div>
                          </div>
                        </GlassPanel>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
              
              {/* Right: Minimal Controls */}
              <div className="flex items-center space-x-2">
                <button 
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  onClick={() => console.log('Settings clicked')}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      </motion.div>

      {/* Floating Metrics */}
      <AnimatePresence>
        {showMetrics && (
          <FloatingMetrics currentMode={currentMode} />
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Centered and Compact */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-4"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        <BottomNavigation
          currentMode={currentMode}
          onModeChange={handleModeChange}
          className="w-auto"
        />
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Mobile Menu */}
            <motion.div
              className="fixed top-0 left-0 w-80 h-full z-60 lg:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <GlassPanel className="h-full p-6" blur="xl" opacity="high">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <GlassButton
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <X className="w-4 h-4" />
                  </GlassButton>
                </div>
                
                {/* Mobile Navigation Items */}
                <div className="space-y-3">
                  {[
                    { id: 'opportunities' as NavigationMode, label: 'Opportunities', icon: '🎯' },
                    { id: 'utilization' as NavigationMode, label: 'Utilization', icon: '📊' },
                    { id: 'revenue' as NavigationMode, label: 'Revenue', icon: '💰' },
                    { id: 'maritime' as NavigationMode, label: 'Maritime', icon: '🚢' },
                    { id: 'satellites' as NavigationMode, label: 'Satellites', icon: '🛰️' }
                  ].map((item) => (
                    <GlassButton
                      key={item.id}
                      variant={currentMode === item.id ? 'default' : 'ghost'}
                      className="w-full justify-start text-left"
                      onClick={() => handleModeChange(item.id)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </GlassButton>
                  ))}
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mode-specific overlays or panels can be added here */}
      <AnimatePresence mode="wait">
        {currentMode === 'maritime' && (
          <motion.div
            key="maritime-overlay"
            className="absolute top-20 right-4 z-30"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            <GlassPanel className="p-4 w-80" blur="lg" opacity="medium">
              <h3 className="text-lg font-semibold text-white mb-3">Maritime Analytics</h3>
              <p className="text-sm text-white/70">
                Real-time vessel tracking and maritime coverage analysis active.
              </p>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AppLayout