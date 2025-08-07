'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapSelection } from '@/lib/hooks/useMapSelection'

interface Insight {
  id: string
  type: 'critical' | 'warning' | 'opportunity' | 'info'
  category: 'notification' | 'insight'
  icon: string
  title: string
  message: string
  timestamp?: Date
  action?: () => void
}

const FloatingInsights: React.FC = () => {
  const { viewContext } = useMapSelection()
  const [notifications, setNotifications] = useState<Insight[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'insights'>('notifications')
  
  // Generate notifications and insights based on context
  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: Insight[] = []
      const newInsights: Insight[] = []
      
      if (viewContext.view === 'stations') {
        // Notifications (time-sensitive alerts)
        if (viewContext.filter === 'utilization') {
          newNotifications.push({
            id: 'notif-util-critical',
            type: 'critical',
            category: 'notification',
            icon: 'fa-exclamation-triangle',
            title: 'Station Alert',
            message: 'Riverside CA dropped below 30% utilization',
            timestamp: new Date(),
            action: () => console.log('Focus on Riverside')
          })
          
          newNotifications.push({
            id: 'notif-util-warning',
            type: 'warning',
            category: 'notification',
            icon: 'fa-exclamation-circle',
            title: 'Capacity Warning',
            message: 'Betzdorf approaching max capacity (95%)',
            timestamp: new Date(Date.now() - 3600000),
            action: () => console.log('Check Betzdorf')
          })
        }
        
        // Key Insights (analytical observations)
        if (viewContext.filter === 'opportunities') {
          newInsights.push({
            id: 'insight-opp-1',
            type: 'opportunity',
            category: 'insight',
            icon: 'fa-lightbulb',
            title: 'High-Value Corridor',
            message: 'North Atlantic route shows $127M opportunity with 3 uncovered zones',
            action: () => console.log('Show opportunity details')
          })
          
          newInsights.push({
            id: 'insight-opp-2',
            type: 'info',
            category: 'insight',
            icon: 'fa-info-circle',
            title: 'Competitor Gap',
            message: 'AWS has no coverage in Southeast Asia maritime routes',
            action: () => console.log('Analyze competitor gap')
          })
        }
        
        if (viewContext.filter === 'maritime') {
          newInsights.push({
            id: 'insight-maritime-1',
            type: 'warning',
            category: 'insight',
            icon: 'fa-ship',
            title: 'Coverage Analysis',
            message: 'Pacific shipping lanes 45% uncovered, $89M potential',
            action: () => console.log('Show maritime analysis')
          })
        }
        
        if (viewContext.filter === 'profit') {
          newInsights.push({
            id: 'insight-profit-1',
            type: 'info',
            category: 'insight',
            icon: 'fa-chart-line',
            title: 'Performance Leader',
            message: 'European stations averaging 23% margin, 8% above target',
            action: () => console.log('Show profit breakdown')
          })
          
          newInsights.push({
            id: 'insight-profit-2',
            type: 'opportunity',
            category: 'insight',
            icon: 'fa-dollar-sign',
            title: 'Revenue Opportunity',
            message: 'Optimizing US East Coast could add $12M annually',
            action: () => console.log('Show optimization plan')
          })
        }
      }
      
      if (viewContext.view === 'satellites') {
        newNotifications.push({
          id: 'notif-sat-1',
          type: 'warning',
          category: 'notification',
          icon: 'fa-satellite',
          title: 'Satellite Alert',
          message: 'SES-17 handover scheduled in 2 hours',
          timestamp: new Date(),
          action: () => console.log('Show handover details')
        })
        
        newInsights.push({
          id: 'insight-sat-1',
          type: 'opportunity',
          category: 'insight',
          icon: 'fa-signal',
          title: 'Capacity Available',
          message: '768 Gbps unused on O3b mPOWER over Asia',
          action: () => console.log('Show capacity map')
        })
      }
      
      setNotifications(newNotifications)
      setInsights(newInsights)
    }
    
    generateNotifications()
  }, [viewContext])
  
  const removeItem = (id: string, category: 'notification' | 'insight') => {
    if (category === 'notification') {
      setNotifications(prev => prev.filter(n => n.id !== id))
    } else {
      setInsights(prev => prev.filter(i => i.id !== id))
    }
  }
  
  const clearAll = (category: 'notification' | 'insight') => {
    if (category === 'notification') {
      setNotifications([])
    } else {
      setInsights([])
    }
  }
  
  // If completely hidden, show a small restore button
  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsVisible(true)}
        className="fixed top-20 left-4 z-20 p-2 bg-black/40 backdrop-blur-xl 
                 border border-white/10 rounded-lg hover:bg-white/5 transition-all
                 group"
        title="Show Notifications & Insights"
      >
        <div className="flex items-center gap-2">
          <i className="fas fa-bell text-yellow-400 text-sm" />
          {(notifications.length > 0 || insights.length > 0) && (
            <span className="bg-yellow-400 text-black text-xs font-bold rounded-full 
                         w-4 h-4 flex items-center justify-center">
              {notifications.length + insights.length}
            </span>
          )}
        </div>
      </motion.button>
    )
  }
  
  const currentItems = activeTab === 'notifications' ? notifications : insights
  
  return (
    <div className={`fixed top-20 left-4 z-20 transition-all duration-300 
                   ${isMinimized ? 'w-12' : 'w-[360px]'}`}>
      {/* Header with Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-t-xl"
      >
        {!isMinimized ? (
          <>
            {/* Tab Buttons */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-all
                         ${activeTab === 'notifications' 
                           ? 'text-white bg-white/10 border-b-2 border-blue-400' 
                           : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-bell text-xs" />
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {notifications.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-all
                         ${activeTab === 'insights' 
                           ? 'text-white bg-white/10 border-b-2 border-blue-400' 
                           : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-lightbulb text-xs" />
                  <span>Key Insights</span>
                  {insights.length > 0 && (
                    <span className="bg-yellow-400 text-black text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {insights.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-white text-xs font-medium">
                {activeTab === 'notifications' ? 'Recent Alerts' : 'Analysis'}
              </span>
              <div className="flex items-center gap-1">
                {currentItems.length > 0 && (
                  <button
                    onClick={() => clearAll(activeTab)}
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
            </div>
          </>
        ) : (
          // Minimized header
          <div className="px-2 py-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-chevron-right text-xs" />
            </button>
          </div>
        )}
      </motion.div>
      
      {/* Content */}
      {!isMinimized && (
        <div className="bg-black/30 backdrop-blur-xl border-x border-b border-white/10 
                      rounded-b-xl max-h-[400px] overflow-y-auto">
          {currentItems.length === 0 ? (
            <div className="p-4 text-center">
              <i className={`fas ${activeTab === 'notifications' ? 'fa-bell-slash' : 'fa-check-circle'} 
                          text-gray-600 text-2xl mb-2`} />
              <p className="text-gray-400 text-xs">
                {activeTab === 'notifications' ? 'No active notifications' : 'No insights available'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              <AnimatePresence mode="popLayout">
                {currentItems.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    onRemove={() => removeItem(item.id, item.category)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
      
      {/* Minimized state - show badge counts */}
      {isMinimized && (notifications.length > 0 || insights.length > 0) && (
        <div className="bg-black/30 backdrop-blur-xl border-x border-b border-white/10 
                      rounded-b-xl p-2">
          <div className="flex flex-col gap-2">
            {notifications.length > 0 && (
              <div className="relative">
                <i className="fas fa-bell text-yellow-400 text-xs" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] 
                             rounded-full w-3 h-3 flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            )}
            {insights.length > 0 && (
              <div className="relative">
                <i className="fas fa-lightbulb text-blue-400 text-xs" />
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] 
                             rounded-full w-3 h-3 flex items-center justify-center">
                  {insights.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const ItemCard: React.FC<{ 
  item: Insight
  index: number
  onRemove: () => void 
}> = ({ item, index, onRemove }) => {
  const getTypeColor = () => {
    switch(item.type) {
      case 'critical': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      case 'opportunity': return 'text-green-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }
  
  const getTypeBg = () => {
    switch(item.type) {
      case 'critical': return 'bg-red-500/10 border-red-500/20'
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20'
      case 'opportunity': return 'bg-green-500/10 border-green-500/20'
      case 'info': return 'bg-blue-500/10 border-blue-500/20'
      default: return 'bg-white/5 border-white/10'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05 }}
      layout
      className={`
        ${getTypeBg()} border rounded-lg p-3
        cursor-pointer transition-all duration-200 group
        hover:bg-white/10
      `}
      onClick={item.action}
    >
      <div className="flex items-start gap-2">
        <i className={`fas ${item.icon} ${getTypeColor()} text-sm mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className="text-white text-sm font-medium">{item.title}</h4>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity
                       text-gray-500 hover:text-white p-0.5"
              title="Remove"
            >
              <i className="fas fa-times text-xs" />
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.message}</p>
          {item.timestamp && (
            <p className="text-gray-500 text-[10px] mt-1">
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        {item.action && (
          <i className="fas fa-chevron-right text-gray-500 text-xs mt-1 
                      opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </motion.div>
  )
}

export default FloatingInsights