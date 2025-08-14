'use client'

import React from 'react'
import { motion } from 'framer-motion'

export type Layer = 'operations' | 'optimizer' | 'opportunities'

interface StreamlinedBottomNavProps {
  currentLayer: Layer
  onLayerChange: (layer: Layer) => void
}

const StreamlinedBottomNav: React.FC<StreamlinedBottomNavProps> = ({
  currentLayer,
  onLayerChange
}) => {
  const navItems = [
    { 
      id: 'operations' as Layer, 
      icon: 'fa-chart-line', 
      label: 'Operations' 
    },
    { 
      id: 'optimizer' as Layer, 
      icon: 'fa-cogs', 
      label: 'Optimizer' 
    },
    { 
      id: 'opportunities' as Layer, 
      icon: 'fa-lightbulb', 
      label: 'Opportunities' 
    }
  ]
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1">
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onLayerChange(item.id)}
              className={`
                relative px-4 py-2 rounded-full transition-all duration-200
                ${currentLayer === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {/* Active indicator */}
              {currentLayer === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Content */}
              <div className="relative flex items-center gap-2">
                <i className={`fas ${item.icon} text-sm`}></i>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StreamlinedBottomNav