'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getPerformanceColor, getPerformanceLabel } from '../layers/GroundStationLayer'

interface PerformanceLegendProps {
  visible: boolean
  mode: 'operations' | 'opportunities' | 'coverage' | 'orbits'
}

const PerformanceLegend: React.FC<PerformanceLegendProps> = ({ visible, mode }) => {
  if (!visible) return null
  
  const performanceLevels = [
    { margin: 0.30, label: 'Highly Profitable', description: '>25% margin' },
    { margin: 0.15, label: 'Profitable', description: '10-25% margin' },
    { margin: 0.05, label: 'Marginal', description: '0-10% margin' },
    { margin: -0.05, label: 'Minor Loss', description: '0-10% loss' },
    { margin: -0.15, label: 'Major Loss', description: '>10% loss' }
  ]
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-24 left-4 bg-black/80 backdrop-blur-xl border border-white/10 
                 rounded-xl p-4 text-white text-xs w-64"
      >
        <div className="mb-3">
          <h3 className="font-semibold text-sm">
            {mode === 'operations' ? 'Station Performance' : 'Opportunities Analysis'}
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            {mode === 'operations' 
              ? 'Size: Revenue • Color: Profitability • Halo: Confidence'
              : 'Maritime traffic density and shipping lanes'
            }
          </p>
        </div>
        
        {mode === 'operations' && (
          <div className="space-y-2">
            {performanceLevels.map((level, index) => {
              const [r, g, b] = getPerformanceColor(level.margin)
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{level.label}</div>
                    <div className="text-gray-400 text-[10px]">{level.description}</div>
                  </div>
                </div>
              )
            })}
            
            {/* Size indicator */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                  <span className="text-gray-400">Size</span>
                </div>
                <span>Revenue</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-white/30 rounded-full"></div>
                  <span className="text-gray-500">Small</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Large</span>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {mode === 'opportunities' && (
          <div className="space-y-2">
            {/* Maritime Legend */}
            <div className="space-y-1">
              <div className="font-medium">Maritime Traffic</div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-gradient-to-r from-blue-900 to-blue-400 rounded"></div>
                <span className="text-gray-400">Vessel Density</span>
              </div>
            </div>
            
            {/* Shipping Lanes */}
            <div className="space-y-1">
              <div className="font-medium">Shipping Lanes</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-blue-400 rounded"></div>
                  <span className="text-gray-400">High Traffic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-0.5 bg-blue-300 rounded"></div>
                  <span className="text-gray-400">Medium Traffic</span>
                </div>
              </div>
            </div>
            
            {/* Ports */}
            <div className="space-y-1">
              <div className="font-medium">Ports</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-gray-400">Major Port</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-400">Secondary Port</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default PerformanceLegend