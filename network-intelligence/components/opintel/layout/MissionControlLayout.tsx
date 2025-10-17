'use client'

import React, { useState, ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  Bell,
  Zap,
  Users,
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
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
import ChatContainer from '@/components/chat/ChatContainer'
import CopilotSidebarWrapper from '@/components/chat/CopilotSidebarWrapper'
import BottomSheet from '@/components/panels/BottomSheet'
import PanelRouter from '@/components/panels/PanelRouter'
import { usePanelStore } from '@/lib/stores/panelStore'
import { useMapStore } from '@/lib/stores/mapStore'
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
  hideSidebar?: boolean // Hide left sidebar (for immersive modes)
  useChatInterface?: boolean // Use new chat interface (Phase 1)
  onSearch?: (query: string) => void
  onPlaceSelect?: (place: GERSPlace) => void
  onChatAction?: (action: string, data: any) => void
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
  hideSidebar = false,
  useChatInterface = true, // Default to new chat interface
  onSearch,
  onPlaceSelect,
  onChatAction
}: MissionControlLayoutProps) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Panel and map stores
  const { isOpen: isPanelOpen, currentHeight: panelHeight } = usePanelStore()
  const { setPadding } = useMapStore()

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)

    setIsDarkMode(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Adjust map padding based on panel height
  useEffect(() => {
    if (isPanelOpen && panelHeight > 0) {
      // Add padding to bottom of map to account for panel
      // Add a bit extra (20px) so important map content isn't right at panel edge
      setPadding({ bottom: panelHeight + 20 })
    } else {
      // Reset padding when panel is closed
      setPadding({ bottom: 0 })
    }
  }, [isPanelOpen, panelHeight, setPadding])

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

      {/* Top-Left Logo & Controls - Floating (hidden when chat interface is active) */}
      {!hideSidebar && !useChatInterface && (
        <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="h-10 w-10 glass-control rounded-lg hover:shadow-xl transition-smooth"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="glass-control rounded-lg px-4 py-2">
            <NexusOneLogo width={130} height={23} className="text-[#080C16]" />
          </div>
        </div>
      )}

      {/* Top-Right User Controls - Floating */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        {/* Notifications */}
        <Button variant="secondary" size="icon" className="h-10 w-10 relative glass-control rounded-lg hover:shadow-xl transition-smooth">
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
            <Button variant="secondary" size="icon" className="h-10 w-10 glass-control rounded-full hover:shadow-xl transition-smooth">
              <User className="h-4 w-4 text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-panel rounded-mundi-lg">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme} className="flex items-center justify-between">
              <span>Theme</span>
              <div className="flex items-center gap-2">
                {isDarkMode ? (
                  <>
                    <Moon className="h-4 w-4" />
                    <span className="text-xs text-muted-foreground">Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    <span className="text-xs text-muted-foreground">Light</span>
                  </>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>Help</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Left Chat Sidebar - Full height modern AI chat interface */}
      {!hideSidebar && useChatInterface && (
        <aside className="absolute top-0 left-0 bottom-0 z-40">
          <CopilotSidebarWrapper onAction={onChatAction} />
        </aside>
      )}

      {/* Left Data Sidebar - Legacy mode when chat interface disabled */}
      {!hideSidebar && !useChatInterface && (
        <AnimatePresence mode="wait">
          {isLeftSidebarOpen && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-20 left-6 z-40 w-80 max-h-[calc(100vh-200px)] glass-panel rounded-lg overflow-hidden animate-fade-in-up"
            >
              <div className="h-full overflow-y-auto">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-title text-foreground">Explore Data</h3>
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
      )}

      {/* Bottom Center Search Dock - Legacy mode only */}
      {!useChatInterface && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-6">
          <div className="glass-search rounded-xl p-4">
            <IntegratedSearchBar
              onPlaceSelect={onPlaceSelect}
              placeholder="Explore places, ask questions, discover insights..."
            />
          </div>
        </div>
      )}

      {/* Right Panel - Overlaid on map */}
      <AnimatePresence mode="wait">
        {isRightPanelOpen && (
          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-20 right-6 z-40 w-[420px] max-h-[calc(100vh-200px)] glass-panel rounded-lg overflow-hidden animate-fade-in-up"
          >
            <div className="h-full overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-title text-foreground">Insights</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsRightPanelOpen(false)}
                  className="h-8 w-8 rounded-lg hover:bg-muted transition-smooth"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                {rightPanel || (
                  <div className="text-caption">
                    Select a location or area to explore insights and trends
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom Timeline - Overlaid on map above search */}
      {bottomTimeline && (
        <div className="absolute bottom-32 left-6 right-6 z-30">
          {bottomTimeline}
        </div>
      )}

      {/* Bottom Sheet Panel */}
      <BottomSheet>
        <PanelRouter />
      </BottomSheet>
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
