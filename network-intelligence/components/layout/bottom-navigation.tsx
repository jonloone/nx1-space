'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Target, 
  BarChart3, 
  DollarSign, 
  Ship, 
  Satellite,
  Activity,
  TrendingUp,
  Waves
} from 'lucide-react'
import { GlassPanel, StatusBadge } from '@/components/ui/glass-components'
import { cn } from '@/lib/utils'

export type NavigationMode = 'opportunities' | 'utilization' | 'revenue' | 'maritime' | 'satellites'

export interface BottomNavigationProps {
  currentMode: NavigationMode
  onModeChange: (mode: NavigationMode) => void
  className?: string
}

interface NavigationItem {
  id: NavigationMode
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: {
    text: string
    status: 'online' | 'offline' | 'warning' | 'info' | 'neutral'
  }
  stats?: {
    primary: string
    secondary?: string
  }
}

const navigationItems: NavigationItem[] = [
  {
    id: 'opportunities',
    label: 'Opportunities',
    icon: Target,
    description: 'Market opportunity analysis',
    badge: { text: 'Active', status: 'online' },
    stats: { primary: '127', secondary: 'zones' }
  },
  {
    id: 'utilization',
    label: 'Utilization',
    icon: BarChart3,
    description: 'Station capacity & usage',
    stats: { primary: '84%', secondary: 'avg' }
  },
  {
    id: 'revenue',
    label: 'Revenue',
    icon: DollarSign,
    description: 'Financial performance',
    badge: { text: '+12%', status: 'online' },
    stats: { primary: '$2.4M', secondary: 'monthly' }
  },
  {
    id: 'maritime',
    label: 'Maritime',
    icon: Ship,
    description: 'Vessel tracking & coverage',
    badge: { text: 'Live', status: 'info' },
    stats: { primary: '1,247', secondary: 'vessels' }
  },
  {
    id: 'satellites',
    label: 'Satellites',
    icon: Satellite,
    description: 'Constellation monitoring',
    stats: { primary: '2,891', secondary: 'tracked' }
  }
]

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentMode,
  onModeChange,
  className
}) => {
  return (
    <div className={cn('bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5', className)}>
      <div className="flex items-center space-x-0.5">
        {navigationItems.map((item, index) => {
          const isActive = currentMode === item.id
          const Icon = item.icon

          return (
            <motion.button
              key={item.id}
              className={cn(
                'relative px-3 py-2 rounded-xl transition-all duration-200',
                'min-w-[100px] group',
                isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
              onClick={() => onModeChange(item.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * 0.1,
                ease: 'easeOut' 
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Content */}
              <div className="relative flex flex-col items-center space-y-0.5">
                <Icon className={cn(
                  'w-4 h-4 transition-colors duration-200',
                  isActive ? 'text-white' : 'text-gray-400'
                )} />
                  
                <span className={cn(
                  'text-[10px] font-medium uppercase tracking-wider',
                  isActive ? 'text-white' : 'text-gray-400'
                )}>
                  {item.label}
                </span>
                {/* Value/Count indicator */}
                {item.stats && isActive && (
                  <span className="text-[9px] text-blue-400 font-semibold">
                    {item.stats.primary}
                  </span>
                )}
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
            )
        })}
      </div>
      
      {/* Optional: Live indicator */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-xl rounded-full px-3 py-1 border border-white/10">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Live</span>
        </div>
      </div>
    </div>
  )
}

export default BottomNavigation