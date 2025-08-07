'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useMapSelection } from '@/lib/hooks/useMapSelection'

interface Insight {
  type: 'critical' | 'warning' | 'opportunity' | 'info'
  icon: string
  title: string
  message: string
  action?: () => void
}

const FloatingInsights: React.FC = () => {
  const { viewContext } = useMapSelection()
  const [insights, setInsights] = useState<Insight[]>([])
  
  // Generate contextual insights based on what's visible
  useEffect(() => {
    const generateInsights = () => {
      const newInsights: Insight[] = []
      
      if (viewContext.view === 'stations') {
        // Check for critical situations
        if (viewContext.filter === 'utilization') {
          newInsights.push({
            type: 'critical',
            icon: '⚠️',
            title: 'Critical Utilization',
            message: '3 stations below 30% utilization',
            action: () => console.log('Focus on critical stations')
          })
        }
        
        // Check for opportunities
        if (viewContext.filter === 'opportunities') {
          newInsights.push({
            type: 'opportunity',
            icon: '💡',
            title: 'High-Value Zone',
            message: '5 opportunities worth $127M detected',
            action: () => console.log('Show opportunity list')
          })
        }
        
        // Maritime insights
        if (viewContext.filter === 'maritime') {
          newInsights.push({
            type: 'warning',
            icon: '🚢',
            title: 'Coverage Gap',
            message: 'North Atlantic route 45% uncovered',
            action: () => console.log('Highlight coverage gaps')
          })
        }
        
        // Profit insights
        if (viewContext.filter === 'profit') {
          newInsights.push({
            type: 'info',
            icon: '📈',
            title: 'Profit Leader',
            message: 'Betzdorf station +23% this month',
            action: () => console.log('Show profit details')
          })
        }
      }
      
      if (viewContext.view === 'satellites') {
        // Satellite-specific insights
        if (viewContext.filter === 'coverage') {
          newInsights.push({
            type: 'warning',
            icon: '🌍',
            title: 'Coverage Alert',
            message: 'South Pacific gap detected',
            action: () => console.log('Focus on coverage gap')
          })
        }
        
        if (viewContext.filter === 'capacity') {
          newInsights.push({
            type: 'opportunity',
            icon: '📶',
            title: 'Capacity Available',
            message: '768 Gbps unused in Asia-Pacific',
            action: () => console.log('Show capacity details')
          })
        }
      }
      
      setInsights(newInsights)
    }
    
    generateInsights()
  }, [viewContext])
  
  return (
    <div className="fixed top-20 left-4 z-20 space-y-2 max-w-[300px]">
      <AnimatePresence>
        {insights.map((insight, index) => (
          <motion.div
            key={`${insight.type}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.1 }}
            className={`
              bg-black/40 backdrop-blur-xl border rounded-xl p-3
              cursor-pointer hover:bg-white/5 transition-all duration-200
              ${insight.type === 'critical' ? 'border-red-500/30' :
                insight.type === 'warning' ? 'border-yellow-500/30' :
                insight.type === 'opportunity' ? 'border-green-500/30' :
                'border-white/10'}
            `}
            onClick={insight.action}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{insight.icon}</span>
              <div className="flex-1">
                <h4 className="text-white text-sm font-medium">{insight.title}</h4>
                <p className="text-gray-400 text-xs mt-0.5">{insight.message}</p>
              </div>
              {insight.action && (
                <ChevronRight className="w-3 h-3 text-gray-500 mt-1" />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default FloatingInsights