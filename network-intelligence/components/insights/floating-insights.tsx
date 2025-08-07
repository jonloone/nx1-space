'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapSelection } from '@/lib/hooks/useMapSelection'

interface Insight {
  id: string
  type: 'critical' | 'warning' | 'opportunity' | 'info'
  icon: string
  title: string
  message: string
  action?: () => void
}

const FloatingInsights: React.FC = () => {
  const { viewContext } = useMapSelection()
  const [insights, setInsights] = useState<Insight[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set())
  
  // Generate contextual insights based on what's visible
  useEffect(() => {
    const generateInsights = () => {
      const newInsights: Insight[] = []
      
      if (viewContext.view === 'stations') {
        // Check for critical situations
        if (viewContext.filter === 'utilization') {
          newInsights.push({
            id: 'util-critical',
            type: 'critical',
            icon: 'fa-exclamation-triangle',
            title: 'Critical Utilization',
            message: '3 stations below 30% utilization',
            action: () => console.log('Focus on critical stations')
          })
        }
        
        // Check for opportunities
        if (viewContext.filter === 'opportunities') {
          newInsights.push({
            id: 'opp-high-value',
            type: 'opportunity',
            icon: 'fa-lightbulb',
            title: 'High-Value Zone',
            message: '5 opportunities worth $127M detected',
            action: () => console.log('Show opportunity list')
          })
        }
        
        // Maritime insights
        if (viewContext.filter === 'maritime') {
          newInsights.push({
            id: 'maritime-gap',
            type: 'warning',
            icon: 'fa-ship',
            title: 'Coverage Gap',
            message: 'North Atlantic route 45% uncovered',
            action: () => console.log('Highlight coverage gaps')
          })
        }
        
        // Profit insights
        if (viewContext.filter === 'profit') {
          newInsights.push({
            id: 'profit-leader',
            type: 'info',
            icon: 'fa-chart-line',
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
            id: 'sat-coverage',
            type: 'warning',
            icon: 'fa-globe',
            title: 'Coverage Alert',
            message: 'South Pacific gap detected',
            action: () => console.log('Focus on coverage gap')
          })
        }
        
        if (viewContext.filter === 'capacity') {
          newInsights.push({
            id: 'sat-capacity',
            type: 'opportunity',
            icon: 'fa-signal',
            title: 'Capacity Available',
            message: '768 Gbps unused in Asia-Pacific',
            action: () => console.log('Show capacity details')
          })
        }
      }
      
      // Filter out dismissed insights
      setInsights(newInsights.filter(insight => !dismissedInsights.has(insight.id)))
    }
    
    generateInsights()
  }, [viewContext, dismissedInsights])
  
  const dismissInsight = (insightId: string) => {
    setDismissedInsights(prev => new Set([...prev, insightId]))
  }
  
  const clearAllInsights = () => {
    const allIds = insights.map(i => i.id)
    setDismissedInsights(prev => new Set([...prev, ...allIds]))
  }
  
  const resetInsights = () => {
    setDismissedInsights(new Set())
  }
  
  // If completely hidden, show a small restore button
  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => {
          setIsVisible(true)
          resetInsights()
        }}
        className="fixed top-20 left-4 z-20 p-2 bg-black/40 backdrop-blur-xl 
                 border border-white/10 rounded-lg hover:bg-white/5 transition-all
                 group"
        title="Show Insights"
      >
        <div className="flex items-center gap-2">
          <i className="fas fa-lightbulb text-yellow-400 text-sm" />
          {insights.length > 0 && (
            <span className="bg-yellow-400 text-black text-xs font-bold rounded-full 
                         w-4 h-4 flex items-center justify-center">
              {insights.length}
            </span>
          )}
        </div>
      </motion.button>
    )
  }
  
  return (
    <div className={`fixed top-20 left-4 z-20 transition-all duration-300 
                   ${isMinimized ? 'w-12' : 'w-[320px]'}`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 
                  rounded-t-xl px-3 py-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <i className="fas fa-lightbulb text-yellow-400 text-sm" />
          {!isMinimized && (
            <>
              <span className="text-white text-xs font-medium uppercase tracking-wider">
                Insights
              </span>
              {insights.length > 0 && (
                <span className="text-gray-500 text-xs">({insights.length})</span>
              )}
            </>
          )}
        </div>
        {!isMinimized && (
          <div className="flex items-center gap-1">
            {insights.length > 0 && (
              <button
                onClick={clearAllInsights}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Clear All"
              >
                <i className="fas fa-broom text-xs" />
              </button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Minimize"
            >
              <i className="fas fa-chevron-left text-xs" />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Hide"
            >
              <i className="fas fa-times text-xs" />
            </button>
          </div>
        )}
        {isMinimized && (
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-chevron-right text-xs" />
          </button>
        )}
      </motion.div>
      
      {/* Content */}
      {!isMinimized && (
        <div className="bg-black/30 backdrop-blur-xl border-x border-b border-white/10 
                      rounded-b-xl max-h-[400px] overflow-y-auto">
          {insights.length === 0 ? (
            <div className="p-4 text-center">
              <i className="fas fa-check-circle text-green-400 text-2xl mb-2" />
              <p className="text-gray-400 text-xs">No active insights</p>
              <button
                onClick={resetInsights}
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Reset dismissed insights
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              <AnimatePresence mode="popLayout">
                {insights.map((insight, index) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    index={index}
                    onDismiss={() => dismissInsight(insight.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
      
      {/* Minimized state - show badges */}
      {isMinimized && insights.length > 0 && (
        <div className="bg-black/30 backdrop-blur-xl border-x border-b border-white/10 
                      rounded-b-xl p-2">
          <div className="flex flex-col gap-1">
            {insights.slice(0, 3).map(insight => (
              <div
                key={insight.id}
                className={`w-2 h-2 rounded-full
                  ${insight.type === 'critical' ? 'bg-red-400' :
                    insight.type === 'warning' ? 'bg-yellow-400' :
                    insight.type === 'opportunity' ? 'bg-green-400' :
                    'bg-blue-400'}
                `}
              />
            ))}
            {insights.length > 3 && (
              <span className="text-[10px] text-gray-500 text-center">+{insights.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const InsightCard: React.FC<{ 
  insight: Insight
  index: number
  onDismiss: () => void 
}> = ({ insight, index, onDismiss }) => {
  const getTypeColor = () => {
    switch(insight.type) {
      case 'critical': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      case 'opportunity': return 'text-green-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05 }}
      layout
      className={`
        bg-white/5 hover:bg-white/10 rounded-lg p-3
        cursor-pointer transition-all duration-200 group
        border border-transparent hover:border-white/10
        ${insight.type === 'critical' ? 'ring-1 ring-red-500/20' :
          insight.type === 'warning' ? 'ring-1 ring-yellow-500/20' :
          insight.type === 'opportunity' ? 'ring-1 ring-green-500/20' :
          ''}
      `}
      onClick={insight.action}
    >
      <div className="flex items-start gap-2">
        <i className={`fas ${insight.icon} ${getTypeColor()} text-sm mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-sm font-medium truncate">{insight.title}</h4>
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{insight.message}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {insight.action && (
            <i className="fas fa-chevron-right text-gray-500 text-xs" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDismiss()
            }}
            className="p-1 text-gray-500 hover:text-white transition-colors"
            title="Dismiss"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default FloatingInsights