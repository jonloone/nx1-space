'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapSelection } from '@/lib/hooks/useMapSelection'
import StationDetailPanel from './station-detail-panel'
import OpportunityPanel from './opportunity-panel'
import SatellitePanel from './satellite-panel'
// import StationInsights from './station-insights' // Removed per request
import SatelliteInsights from './satellite-insights'

const ContextualPanels: React.FC = () => {
  const { 
    selectedStation, 
    selectedHexagon, 
    selectedSatellite,
    viewContext 
  } = useMapSelection()
  
  // Determine which panels to show based on context
  const getPanelsToShow = () => {
    const panels = []
    
    // Station selected - show detailed analytics
    if (selectedStation) {
      panels.push({
        id: 'station-detail',
        component: <StationDetailPanel station={selectedStation} />,
        position: 'right' as const
      })
    }
    
    // Hexagon selected - show opportunity analysis
    if (selectedHexagon) {
      panels.push({
        id: 'opportunity-detail',
        component: <OpportunityPanel hexagon={selectedHexagon} />,
        position: 'right' as const
      })
    }
    
    // Satellite selected - show orbit and coverage
    if (selectedSatellite) {
      panels.push({
        id: 'satellite-detail',
        component: <SatellitePanel satellite={selectedSatellite} />,
        position: 'right' as const
      })
    }
    
    // View-specific context panels - removed StationInsights completely
    
    if (viewContext.view === 'satellites' && !selectedSatellite) {
      panels.push({
        id: 'satellite-insights',
        component: <SatelliteInsights filter={viewContext.filter} />,
        position: 'top-right' as const
      })
    }
    
    return panels
  }
  
  const panels = getPanelsToShow()
  
  return (
    <AnimatePresence>
      {panels.map(panel => (
        <ContextPanel
          key={panel.id}
          id={panel.id}
          position={panel.position}
        >
          {panel.component}
        </ContextPanel>
      ))}
    </AnimatePresence>
  )
}

// Individual context panel wrapper
const ContextPanel: React.FC<{
  id: string
  position: 'right' | 'top-right' | 'bottom-left'
  children: React.ReactNode
}> = ({ id, position, children }) => {
  const positionClasses = {
    'right': 'right-0 top-20 bottom-20 w-[380px]',
    'top-right': 'right-4 top-20 w-[320px]',
    'bottom-left': 'left-4 bottom-20 w-[280px]'
  }
  
  const animations = {
    'right': {
      initial: { x: 400, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 400, opacity: 0 }
    },
    'top-right': {
      initial: { y: -20, opacity: 0, scale: 0.95 },
      animate: { y: 0, opacity: 1, scale: 1 },
      exit: { y: -20, opacity: 0, scale: 0.95 }
    },
    'bottom-left': {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -20, opacity: 0 }
    }
  }
  
  return (
    <motion.div
      {...animations[position]}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`
        fixed ${positionClasses[position]} z-30
        bg-black/30 backdrop-blur-2xl border border-white/10 
        rounded-2xl overflow-hidden
      `}
    >
      {children}
    </motion.div>
  )
}

export default ContextualPanels