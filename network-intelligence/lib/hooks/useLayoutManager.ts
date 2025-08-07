'use client'

import { useState, useEffect } from 'react'

interface CollisionZone {
  x: number
  y: number
  width: number
  height: number
}

interface ActiveElements {
  topBar: boolean
  bottomNav: boolean
  leftMetrics: boolean
  rightPanel: boolean
  tooltip: null | string
}

export const useLayoutManager = () => {
  const [activeElements, setActiveElements] = useState<ActiveElements>({
    topBar: true,
    bottomNav: true,
    leftMetrics: true,
    rightPanel: false,
    tooltip: null
  })
  
  const [collisionZones, setCollisionZones] = useState<Record<string, CollisionZone>>({
    topCenter: { x: 0, y: 0, width: 800, height: 60 },
    bottomCenter: { x: 0, y: 0, width: 600, height: 80 },
    leftSide: { x: 0, y: 80, width: 260, height: 0 },
    rightSide: { x: 0, y: 0, width: 420, height: 0 }
  })
  
  // Update collision zones on resize
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      
      setCollisionZones({
        topCenter: { 
          x: w / 2 - 400, 
          y: 0, 
          width: 800, 
          height: 60 
        },
        bottomCenter: { 
          x: w / 2 - 300, 
          y: h - 80, 
          width: 600, 
          height: 80 
        },
        leftSide: { 
          x: 0, 
          y: 80, 
          width: 260, 
          height: h - 160 
        },
        rightSide: { 
          x: w - 420, 
          y: 0, 
          width: 420, 
          height: h 
        }
      })
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Check for collisions
  const checkCollision = (element: string, position: { x: number, y: number }) => {
    const zones = Object.entries(collisionZones)
    for (const [zone, rect] of zones) {
      if (zone !== element && 
          position.x >= rect.x && 
          position.x <= rect.x + rect.width &&
          position.y >= rect.y && 
          position.y <= rect.y + rect.height) {
        return zone
      }
    }
    return null
  }
  
  // Auto-hide elements on collision
  const handleHover = (element: string, isHovering: boolean) => {
    if (isHovering) {
      // Reduce opacity of other elements
      if (element === 'bottomNav') {
        setActiveElements(prev => ({ ...prev, leftMetrics: false }))
      }
    } else {
      // Restore all elements
      setActiveElements(prev => ({ 
        ...prev, 
        leftMetrics: true 
      }))
    }
  }
  
  return {
    activeElements,
    checkCollision,
    handleHover,
    collisionZones
  }
}

// Responsive hook for different screen sizes
export const useResponsiveLayout = () => {
  const [layout, setLayout] = useState({
    topBarWidth: 'max-w-3xl',
    bottomNavWidth: 'w-auto',
    metricCardSize: 'normal',
    fontSize: 'base'
  })
  
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth
      
      if (width < 640) {
        // Mobile
        setLayout({
          topBarWidth: 'w-full px-2',
          bottomNavWidth: 'w-full',
          metricCardSize: 'compact',
          fontSize: 'sm'
        })
      } else if (width < 1024) {
        // Tablet
        setLayout({
          topBarWidth: 'max-w-2xl',
          bottomNavWidth: 'w-auto',
          metricCardSize: 'compact',
          fontSize: 'base'
        })
      } else if (width < 1440) {
        // Laptop
        setLayout({
          topBarWidth: 'max-w-3xl',
          bottomNavWidth: 'w-auto',
          metricCardSize: 'normal',
          fontSize: 'base'
        })
      } else {
        // Desktop
        setLayout({
          topBarWidth: 'max-w-4xl',
          bottomNavWidth: 'w-auto',
          metricCardSize: 'normal',
          fontSize: 'lg'
        })
      }
    }
    
    updateLayout()
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [])
  
  return layout
}

// Framer Motion variants for smooth UI transitions
export const uiAnimations = {
  // Fade in/out with scale
  fadeScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 }
  },
  
  // Slide from bottom
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  
  // Hover lift
  hoverLift: {
    whileHover: { 
      y: -2, 
      boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)' 
    }
  },
  
  // Collision avoidance
  avoidCollision: {
    animate: (collision: boolean) => ({
      opacity: collision ? 0.3 : 1,
      scale: collision ? 0.95 : 1,
      filter: collision ? 'blur(2px)' : 'blur(0px)'
    }),
    transition: { duration: 0.3 }
  }
}