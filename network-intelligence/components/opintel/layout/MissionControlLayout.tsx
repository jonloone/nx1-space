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
import PersistentChatPanel from '@/components/chat/PersistentChatPanel'
import { CardDock } from '@/components/opintel/CardDock'
import { IntelligenceAlertArtifact } from '@/components/ai/artifacts/IntelligenceAlertArtifact'
import { SubjectProfileCard } from '@/components/investigation/SubjectProfileCard'
import { TimelineCard } from '@/components/investigation/TimelineCard'
import { NetworkAnalysisCard } from '@/components/investigation/NetworkAnalysisCard'
import ArtifactRenderer from '@/components/ai/artifacts/ArtifactRenderer'
import { AIChatPanelRef } from '@/components/ai/AIChatPanel'
import { getCitizens360DataService } from '@/lib/services/citizens360DataService'
import BottomSheet from '@/components/panels/BottomSheet'
import PanelRouter from '@/components/panels/PanelRouter'
import { usePanelStore } from '@/lib/stores/panelStore'
import { useMapStore } from '@/lib/stores/mapStore'
import { useAnalysisStore } from '@/lib/stores/analysisStore'
import { GERSPlace } from '@/lib/services/gersDemoService'

// Simple city center coordinates lookup for common cities
const CITY_COORDINATES: Record<string, [number, number]> = {
  // New York
  'new york': [-74.006, 40.7128],
  'manhattan': [-73.9712, 40.7831],
  'brooklyn': [-73.9442, 40.6782],
  'queens': [-73.7949, 40.7282],
  // California
  'san francisco': [-122.4194, 37.7749],
  'los angeles': [-118.2437, 34.0522],
  'san diego': [-117.1611, 32.7157],
  // Other major cities
  'chicago': [-87.6298, 41.8781],
  'houston': [-95.3698, 29.7604],
  'phoenix': [-112.0740, 33.4484],
  'philadelphia': [-75.1652, 39.9526],
  'washington': [-77.0369, 38.9072],
  'boston': [-71.0589, 42.3601],
  'miami': [-80.1918, 25.7617],
  'seattle': [-122.3321, 47.6062],
  // Default fallback
  'flushing': [-73.8303, 40.7673]
}

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
  chatRef?: React.RefObject<AIChatPanelRef> // Ref for programmatic chat control
  chatAnalysisContent?: React.ReactNode // Analysis drawer content
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
  chatRef,
  chatAnalysisContent,
  onSearch,
  onPlaceSelect,
  onChatAction
}: MissionControlLayoutProps) {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [chatHeight, setChatHeight] = useState(70) // Default collapsed height

  // Panel and map stores
  const { isOpen: isPanelOpen, currentHeight: panelHeight, rightPanelMode, closeRightPanel } = usePanelStore()
  const { setPadding, flyTo, addMarker } = useMapStore()
  const { artifacts, removeArtifact, pushArtifact, expandArtifact, minimizeArtifact } = useAnalysisStore()

  // Filter artifacts into minimized and expanded
  const minimizedArtifacts = artifacts.filter(a => a.isMinimized)
  const expandedArtifacts = artifacts.filter(a => !a.isMinimized)

  // Citizens360 data service
  const citizens360Service = getCitizens360DataService()

  // Sync local isRightPanelOpen state with Zustand store's rightPanelMode
  useEffect(() => {
    setIsRightPanelOpen(rightPanelMode !== null)
  }, [rightPanelMode])

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

  // Handle progressive investigation actions
  const handleInvestigationAction = async (action: string, data: any) => {
    console.log('🎯 Investigation action:', action, data)

    switch (action) {
      case 'view-subject-profile': {
        // Load subject profile data
        const subjectId = data.subjectId || 'SUBJECT-2547' // Default to Marcus J. Rahman
        const caseNumber = data.caseNumber || 'CT-2024-8473'

        console.log(`👤 Loading profile for ${subjectId} from case ${caseNumber}`)

        try {
          const profile = await citizens360Service.getSubjectById(caseNumber, subjectId)

          if (profile) {
            console.log('✅ Profile loaded:', profile.name.full)
            pushArtifact({
              type: 'subject-profile',
              data: profile
            })
          } else {
            console.warn('⚠️ No profile found for subject:', subjectId)
          }
        } catch (error) {
          console.error('❌ Failed to load subject profile:', error)
        }
        break
      }

      case 'view-timeline': {
        // Load timeline events for subject
        const subjectId = data.subjectId || data.profile?.subjectId || 'SUBJECT-2547'
        const caseNumber = 'CT-2024-8473'

        try {
          const timeline = await citizens360Service.loadTimeline(caseNumber, subjectId)
          const subject = await citizens360Service.getSubjectById(caseNumber, subjectId)

          if (timeline && timeline.length > 0) {
            // Calculate period from timeline events
            const timestamps = timeline.map(e => e.timestamp.getTime())
            const period = {
              start: new Date(Math.min(...timestamps)),
              end: new Date(Math.max(...timestamps))
            }

            const subjectName = data.subjectName || subject?.name?.full || data.profile?.name?.full || 'Subject'

            pushArtifact({
              type: 'timeline',
              data: {
                title: `${subjectName} - Movement Timeline`,
                period,
                events: timeline,
                summary: `${timeline.length} events over ${Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24))} days`,
                subjectId, // Include subjectId for network loading
                subjectName
              }
            })
          }
        } catch (error) {
          console.error('Failed to load timeline:', error)
        }
        break
      }

      case 'show-network': {
        // Load network analysis for subject
        const subjectId = data.subjectId || data.profile?.subjectId || 'SUBJECT-2547'
        const caseNumber = 'CT-2024-8473'

        console.log('📡 Loading network for subject:', subjectId)

        try {
          // Ensure both subject and timeline are loaded
          const subject = await citizens360Service.getSubjectById(caseNumber, subjectId)
          console.log('📡 Subject loaded:', subject?.name?.full)

          await citizens360Service.loadTimeline(caseNumber, subjectId)
          console.log('📡 Timeline loaded')

          // Now get the network (which uses cached data)
          const network = citizens360Service.getSubjectNetwork(subjectId)
          console.log('📡 Network data:', network ? `${network.nodes.length} nodes, ${network.connections.length} connections` : 'NULL')

          if (network) {
            // Transform network data to NetworkGraphData format
            // Service returns: { centerNode: {id, name, type, riskLevel}, nodes: [], connections: [] }
            // Type expects: { title, nodes: NetworkNode[], edges: NetworkEdge[], centerNode: string }

            const networkGraphData = {
              title: `${network.centerNode.name} - Network Analysis`,
              centerNode: network.centerNode.id, // Convert object to ID string
              nodes: [
                // Include center node
                {
                  id: network.centerNode.id,
                  label: network.centerNode.name,
                  type: network.centerNode.type,
                  riskScore: network.centerNode.riskLevel === 'high' ? 90 : network.centerNode.riskLevel === 'medium' ? 50 : 20
                },
                // Map other nodes: change 'name' to 'label', add riskScore
                ...network.nodes.map(node => ({
                  id: node.id,
                  label: node.name,
                  type: node.type === 'organization' ? 'entity' : node.type, // Map 'organization' to 'entity'
                  riskScore: node.riskLevel === 'high' ? 90 : node.riskLevel === 'medium' ? 50 : 20
                }))
              ],
              edges: network.connections.map((conn, idx) => ({
                source: conn.from,
                target: conn.to,
                type: conn.type,
                weight: conn.frequency,
                timestamp: conn.lastContact,
                label: conn.frequency > 1 ? `${conn.frequency}x` : undefined
              }))
            }

            console.log('📡 Pushing network-graph artifact with data:', networkGraphData)

            pushArtifact({
              type: 'network-graph',
              data: networkGraphData
            })

            console.log('📡 Network-graph artifact pushed successfully')
          } else {
            console.warn('📡 No network data returned from service')
          }
        } catch (error) {
          console.error('📡 Failed to load network:', error)
        }
        break
      }

      case 'show-on-map': {
        // Handle showing event/location on map
        console.log('🗺️ Show on map action:', data)

        let coordinates: [number, number] | null = null
        let markerLabel = 'Location'
        let markerType: 'address' | 'event' | 'subject' | 'generic' = 'generic'

        // If data has coordinates directly (from timeline events)
        if (data.location?.coordinates) {
          coordinates = data.location.coordinates
          markerLabel = data.location.name || data.title || 'Event Location'
          markerType = 'event'
        }
        // If data has address info (from subject profile)
        else if (data.city || data.address) {
          const cityKey = (data.city || '').toLowerCase().trim()
          coordinates = CITY_COORDINATES[cityKey] || null

          // Create label from address
          if (data.address) {
            markerLabel = `${data.address}, ${data.city || ''}`
          } else {
            markerLabel = data.city || 'Address'
          }
          markerType = 'address'

          if (!coordinates) {
            console.warn(`⚠️ No coordinates found for city: ${cityKey}`)
            // Try to use state fallback or default
            coordinates = CITY_COORDINATES['new york'] // Default fallback
          }
        }

        if (coordinates) {
          console.log(`📍 Flying to coordinates: ${coordinates}`)

          // Add marker to the map
          addMarker({
            coordinates,
            label: markerLabel,
            type: markerType,
            metadata: data
          })

          // Collapse chat panel to show more map
          chatRef?.current?.collapse()

          // Pan to location with smooth animation
          flyTo(coordinates[0], coordinates[1], 15)
        } else {
          console.warn('⚠️ Could not determine coordinates for location')
        }
        break
      }

      case 'add-to-map': {
        // Handle adding network/data to map
        console.log('Add to map:', data)
        break
      }

      default:
        // Forward to parent onChatAction if not handled here
        onChatAction?.(action, data)
        break
    }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden layout-container">
      {/* Full-Screen Map Backdrop */}
      <div className="absolute inset-0 map-card">
        {children}

          {/* Top-Left Logo & Controls - Floating inside map card (hidden when chat interface is active) */}
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

          {/* Legacy Left Sidebar - inside map card for legacy mode */}
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

          {/* Bottom Timeline - inside map card */}
          {bottomTimeline && (
            <div className="absolute bottom-32 left-6 right-6 z-30">
              {bottomTimeline}
            </div>
          )}
      </div>

      {/* Persistent Chat Panel - Bottom Left */}
      {!hideSidebar && useChatInterface && (
        <div className="absolute bottom-4 left-4 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <PersistentChatPanel
              ref={chatRef}
              onAction={handleInvestigationAction}
              onHeightChange={setChatHeight}
            />
          </div>
        </div>
      )}

      {/* Investigation Cards - Adaptive Masonry Grid (Max 3 Expanded) */}
      {!hideSidebar && useChatInterface && expandedArtifacts.length > 0 && (
        <motion.div
          className="absolute left-4 right-4 z-40 pointer-events-none overflow-y-auto overflow-x-hidden"
          animate={{
            top: minimizedArtifacts.length > 0 ? '76px' : '16px', // 24px (top-6) + 40px (dock height) + 12px gap
            maxHeight: `calc(100vh - ${chatHeight}px - ${minimizedArtifacts.length > 0 ? 76 : 16}px - 16px)`
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="grid gap-3 pointer-events-auto"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gridAutoFlow: 'dense',
              alignItems: 'start'
            }}
          >
            <AnimatePresence mode="popLayout">
              {expandedArtifacts.map((artifact) => (
                <motion.div
                  key={artifact.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {artifact.type === 'intelligence-alert' && (
                    <IntelligenceAlertArtifact
                      alert={artifact.data}
                      onAction={handleInvestigationAction}
                      onClose={() => removeArtifact(artifact.id)}
                    />
                  )}
                  {artifact.type === 'subject-profile' && (
                    <SubjectProfileCard
                      profile={artifact.data}
                      onAction={handleInvestigationAction}
                      onClose={() => removeArtifact(artifact.id)}
                    />
                  )}
                  {artifact.type === 'timeline' && (
                    <TimelineCard
                      events={artifact.data.events}
                      subjectName={artifact.data.subjectName}
                      subjectId={artifact.data.subjectId}
                      onAction={handleInvestigationAction}
                      onClose={() => removeArtifact(artifact.id)}
                    />
                  )}
                  {artifact.type === 'network-analysis' && (
                    <NetworkAnalysisCard
                      centerNode={artifact.data.centerNode}
                      nodes={artifact.data.nodes}
                      connections={artifact.data.connections}
                      onAction={handleInvestigationAction}
                      onClose={() => removeArtifact(artifact.id)}
                    />
                  )}
                  {artifact.type === 'network-graph' && (
                    <ArtifactRenderer artifact={artifact} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Top-Right User Controls - Floating over map */}
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

      {/* Card Dock - Minimized cards appear as tabs */}
      {!hideSidebar && useChatInterface && (
        <CardDock
          minimizedArtifacts={minimizedArtifacts}
          onExpand={expandArtifact}
          onRemove={removeArtifact}
        />
      )}

      {/* Right Panel - Full height, wider, clean design - Above all UI elements */}
      <AnimatePresence mode="wait">
        {isRightPanelOpen && (
          <motion.aside
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-0 right-0 bottom-0 z-[60] w-[480px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            {rightPanel}
          </motion.aside>
        )}
      </AnimatePresence>

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
