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
  onSearch
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
    <div className="h-screen w-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Navigation Bar - 48px */}
      <header className="h-12 border-b border-white/10 bg-black/40 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-50">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">OI</span>
            </div>
            <span className="text-sm font-semibold text-white hidden sm:inline">
              OpIntel
            </span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 text-sm text-white/80 hover:text-white hidden md:flex">
                {projectName}
                <ChevronRight className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Switch Project</DropdownMenuItem>
              <DropdownMenuItem>New Project</DropdownMenuItem>
              <DropdownMenuItem>Project Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-48 pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </form>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]">
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Live Status */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs text-white/80 hidden sm:inline">
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Active Users */}
          <Button variant="ghost" size="icon" className="h-8 w-8 relative hidden md:flex">
            <Users className="h-4 w-4" />
            {activeUsers > 1 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center bg-blue-500 text-[10px]">
                {activeUsers}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Help</DropdownMenuItem>
              <DropdownMenuItem className="text-red-400">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Left Sidebar */}
        <AnimatePresence mode="wait">
          {isLeftSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-white/10 bg-black/20 backdrop-blur-sm shrink-0 overflow-hidden z-40"
            >
              <div className="w-60 h-full overflow-y-auto">
                {leftSidebar || (
                  <div className="p-4 text-white/60 text-sm">
                    Left Sidebar Content
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Map Canvas (Center) */}
        <main className="flex-1 relative overflow-hidden">
          {children}

          {/* Toggle Left Sidebar Button (when closed) */}
          {!isLeftSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLeftSidebarOpen(true)}
              className="absolute top-4 left-4 z-30 h-8 w-8 bg-black/40 backdrop-blur-sm border border-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </main>

        {/* Right Panel */}
        <AnimatePresence mode="wait">
          {isRightPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-white/10 bg-black/20 backdrop-blur-sm shrink-0 overflow-hidden z-40"
            >
              <div className="w-[400px] h-full overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <h3 className="text-white font-semibold">Details</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRightPanelOpen(false)}
                    className="h-6 w-6"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4">
                  {rightPanel || (
                    <div className="text-white/60 text-sm">
                      Right Panel Content
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Timeline */}
      <AnimatePresence mode="wait">
        {bottomTimeline && (
          <motion.footer
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isTimelineExpanded ? 200 : 60,
              opacity: 1
            }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 bg-black/40 backdrop-blur-sm shrink-0 overflow-hidden"
          >
            <div className="p-3">
              {bottomTimeline}
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
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
