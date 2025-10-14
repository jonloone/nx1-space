'use client'

import React, { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Bell,
  Zap,
  Users,
  Search,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import NexusOneLogo from '@/components/branding/NexusOneLogo'
import IntegratedSearchBar from '@/components/search/IntegratedSearchBar'
import { GERSPlace } from '@/lib/services/gersDemoService'

interface MissionControlLayoutProps {
  children: ReactNode
  leftSidebar?: ReactNode
  rightPanel?: ReactNode
  bottomTimeline?: ReactNode
  projectName?: string
  notificationCount?: number
  isLive?: boolean
  activeUsers?: number
  onSearch?: (query: string) => void
  onPlaceSelect?: (place: GERSPlace) => void
}

/**
 * Mission Control Layout
 * Inspired by Felt.com and Windward.ai
 * - Map-first (85% screen)
 * - Collapsible sidebars
 * - Context-sensitive panels
 * - Minimal chrome
 */
export default function MissionControlLayout({
  children,
  leftSidebar,
  rightPanel,
  bottomTimeline,
  projectName = 'Untitled Project',
  notificationCount = 0,
  isLive = false,
  activeUsers = 1,
  onSearch,
  onPlaceSelect
}: MissionControlLayoutProps) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  return (
    <div className="h-screen w-full relative bg-neutral-50 overflow-hidden">
      {/* Full-Screen Map Canvas */}
      <main className="absolute inset-0 w-full h-full">
        {children}
      </main>

      {/* Top-Left Logo & Controls - Floating */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          className="h-10 w-10 bg-white border border-border shadow-lg rounded-lg hover:shadow-xl transition-shadow"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="bg-white border border-border shadow-lg rounded-lg px-4 py-2">
          <NexusOneLogo width={130} height={23} className="text-[#080C16]" />
        </div>
      </div>

      {/* Top-Right User Controls - Floating */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        {/* Notifications */}
        <Button variant="secondary" size="icon" className="h-10 w-10 relative bg-white border border-border shadow-lg rounded-lg hover:shadow-xl transition-shadow">
          <Bell className="h-4 w-4 text-foreground" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] rounded-full">
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-10 w-10 bg-white border border-border shadow-lg rounded-full hover:shadow-xl transition-shadow">
              <User className="h-4 w-4 text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-mundi-lg">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Help</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Left Sidebar - Overlaid on map, not full height */}
      <AnimatePresence mode="wait">
        {isLeftSidebarOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-20 left-6 z-40 w-80 max-h-[calc(100vh-200px)] bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-xl overflow-hidden"
          >
            <div className="h-full overflow-y-auto">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-[#171717]">{projectName}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLeftSidebarOpen(false)}
                  className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              {leftSidebar || (
                <div className="p-6 text-muted-foreground text-sm">
                  Left Sidebar Content
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom Center Search Dock - Overlaid on map */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-6">
        <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl p-4">
          <IntegratedSearchBar
            onPlaceSelect={onPlaceSelect}
            placeholder="Search places, facilities, infrastructure..."
          />
        </div>
      </div>

      {/* Right Panel - Overlaid on map */}
      <AnimatePresence mode="wait">
        {isRightPanelOpen && (
          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-20 right-6 z-40 w-[420px] max-h-[calc(100vh-200px)] bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-xl overflow-hidden"
          >
            <div className="h-full overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-foreground font-semibold text-lg">Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsRightPanelOpen(false)}
                  className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                {rightPanel || (
                  <div className="text-muted-foreground text-sm">
                    Right Panel Content
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom Timeline - Overlaid on map if needed */}
      {bottomTimeline && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-32 left-6 right-6 z-30 bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-xl overflow-hidden"
            style={{ height: isTimelineExpanded ? 220 : 72 }}
          >
            <div className="p-4">
              {bottomTimeline}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

// Export helper hook for controlling panels
export function useMissionControl() {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [rightPanelContent, setRightPanelContent] = useState<ReactNode>(null)

  const openRightPanel = (content: ReactNode) => {
    setRightPanelContent(content)
    setIsRightPanelOpen(true)
  }

  const closeRightPanel = () => {
    setIsRightPanelOpen(false)
  }

  return {
    isRightPanelOpen,
    rightPanelContent,
    openRightPanel,
    closeRightPanel
  }
}
