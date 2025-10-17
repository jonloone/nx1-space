'use client'

import React, { useEffect, useRef } from 'react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { X, GripHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  usePanelStore,
  getClosestDetent,
  getDetentFromVelocity,
  DETENT_CONFIG
} from '@/lib/stores/panelStore'

interface BottomSheetProps {
  children: React.ReactNode
  className?: string
}

/**
 * BottomSheet Component
 *
 * iOS-style bottom sheet with three detents:
 * - Collapsed (20%): Peek view
 * - Medium (50%): Partial view
 * - Expanded (85%): Full view
 *
 * Features:
 * - Drag gestures with react-spring
 * - Fling detection
 * - Background interaction (map remains tappable)
 * - Smooth animations
 */
export default function BottomSheet({ children, className = '' }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const {
    isOpen,
    detent,
    isDragging,
    currentHeight,
    setDetent,
    setDragging,
    setCurrentHeight,
    closePanel,
    getDetentHeight
  } = usePanelStore()

  // Spring animation for height
  const [{ y }, api] = useSpring(() => ({
    y: typeof window !== 'undefined' ? window.innerHeight : 1000,
    config: config.stiff
  }))

  // Update spring when detent changes
  useEffect(() => {
    if (!isOpen) {
      // Animate out
      api.start({
        y: typeof window !== 'undefined' ? window.innerHeight : 1000,
        immediate: false
      })
    } else {
      // Animate to detent
      const targetHeight = getDetentHeight(detent)
      const targetY = (typeof window !== 'undefined' ? window.innerHeight : 1000) - targetHeight

      api.start({
        y: targetY,
        immediate: isDragging
      })

      setCurrentHeight(targetHeight)
    }
  }, [isOpen, detent, isDragging])

  // Drag gesture
  const bind = useDrag(
    ({ last, velocity: [, vy], direction: [, dy], offset: [, offsetY], cancel }) => {
      // Prevent dragging up beyond expanded
      if (offsetY < (typeof window !== 'undefined' ? window.innerHeight : 1000) * (1 - DETENT_CONFIG.expanded)) {
        cancel()
        return
      }

      if (last) {
        // Drag ended - snap to nearest detent
        setDragging(false)

        const currentHeightValue = (typeof window !== 'undefined' ? window.innerHeight : 1000) - offsetY

        // Determine target detent based on velocity and position
        const targetDetent = getDetentFromVelocity(currentHeightValue, vy, dy)

        if (targetDetent === 'hidden') {
          closePanel()
        } else {
          setDetent(targetDetent)
        }
      } else {
        // Dragging
        setDragging(true)

        // Update spring position immediately
        api.start({
          y: offsetY,
          immediate: true
        })

        // Update current height in store
        const height = (typeof window !== 'undefined' ? window.innerHeight : 1000) - offsetY
        setCurrentHeight(height)
      }
    },
    {
      from: () => [0, y.get()],
      bounds: () => ({
        top: (typeof window !== 'undefined' ? window.innerHeight : 1000) * (1 - DETENT_CONFIG.expanded),
        bottom: typeof window !== 'undefined' ? window.innerHeight : 1000
      }),
      rubberband: true,
      filterTaps: true,
      axis: 'y'
    }
  )

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        const targetHeight = getDetentHeight(detent)
        const targetY = window.innerHeight - targetHeight

        api.start({
          y: targetY,
          immediate: true
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, detent])

  // Don't render if not open
  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop (optional, for visual effect) */}
      {detent === 'expanded' && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={() => setDetent('medium')}
        />
      )}

      {/* Bottom Sheet */}
      <animated.div
        ref={sheetRef}
        {...bind()}
        style={{
          y,
          touchAction: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100vh',
          zIndex: 50
        }}
        className={`flex flex-col ${className}`}
      >
        {/* Sheet Content */}
        <div className="glass-panel rounded-t-2xl shadow-2xl overflow-hidden flex flex-col h-full">
          {/* Drag Handle */}
          <div className="flex-shrink-0 pt-3 pb-2 px-4 flex items-center justify-between border-b border-border/50">
            <div className="flex-1" />

            {/* Center Grip */}
            <div className="flex-1 flex justify-center">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50 transition-colors cursor-grab active:cursor-grabbing" />
            </div>

            {/* Close Button */}
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={closePanel}
                className="h-8 w-8 rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </animated.div>
    </>
  )
}

/**
 * Helper component for panel headers
 */
export function PanelHeader({
  title,
  subtitle
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="px-6 py-4 border-b border-border/50">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}

/**
 * Helper component for panel sections
 */
export function PanelSection({
  title,
  children,
  className = ''
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      )}
      {children}
    </div>
  )
}
