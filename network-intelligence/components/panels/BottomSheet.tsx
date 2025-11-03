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
    console.log('🔄 BottomSheet useEffect triggered - isOpen:', isOpen, 'detent:', detent, 'isDragging:', isDragging)

    if (!isOpen) {
      // Animate out
      console.log('🚪 Animating out - closing panel')
      api.start({
        y: typeof window !== 'undefined' ? window.innerHeight : 1000,
        immediate: false
      })
    } else {
      // Animate to detent
      const targetHeight = getDetentHeight(detent)
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000
      // Need to move UP (negative value) to show the bottom portion
      const targetY = -(windowHeight - targetHeight)

      console.log('🎯 Spring animation calculation:', {
        windowHeight,
        targetHeight,
        targetY,
        detent,
        currentYValue: y.get()
      })

      api.start({
        y: targetY,
        immediate: isDragging
      })

      // Check DOM after a short delay
      setTimeout(() => {
        if (sheetRef.current) {
          const computedStyle = window.getComputedStyle(sheetRef.current)
          console.log('🎨 BottomSheet DOM after animation:', {
            transform: computedStyle.transform,
            bottom: computedStyle.bottom,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            height: computedStyle.height,
            visibility: computedStyle.visibility,
            display: computedStyle.display,
            opacity: computedStyle.opacity
          })
        }
      }, 100)

      setCurrentHeight(targetHeight)
    }
  }, [isOpen, detent, isDragging])

  // Drag gesture
  const bind = useDrag(
    ({ last, velocity: [, vy], direction: [, dy], offset: [, offsetY], cancel }) => {
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000

      // Prevent dragging up beyond expanded (offsetY is negative when dragging up)
      const maxUpDrag = -(windowHeight * (1 - DETENT_CONFIG.expanded))
      if (offsetY < maxUpDrag) {
        cancel()
        return
      }

      if (last) {
        // Drag ended - snap to nearest detent
        setDragging(false)

        // Convert offsetY (negative = up) to height
        const currentHeightValue = windowHeight + offsetY

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

        // Update spring position immediately (offsetY is already negative for up movement)
        api.start({
          y: offsetY,
          immediate: true
        })

        // Update current height in store (convert negative offsetY to height)
        const height = windowHeight + offsetY
        setCurrentHeight(height)
      }
    },
    {
      from: () => [0, y.get()],
      bounds: () => {
        const wh = typeof window !== 'undefined' ? window.innerHeight : 1000
        return {
          top: -(wh * (1 - DETENT_CONFIG.expanded)), // Most negative (expanded)
          bottom: 0 // Closed position
        }
      },
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
    console.log('🚫 BottomSheet not rendering - isOpen:', isOpen)
    return null
  }

  console.log('✅ BottomSheet rendering - isOpen:', isOpen, 'detent:', detent, 'currentHeight:', currentHeight)

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
          transform: y.to(val => `translateY(${val}px)`),
          touchAction: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100vh',
          zIndex: 1001 // Above AlertVisualization (1000)
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
