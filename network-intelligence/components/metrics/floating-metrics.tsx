'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  Radio, 
  Activity, 
  Ship, 
  Satellite, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Zap,
  Globe,
  Users,
  Target,
  X
} from 'lucide-react'
import { AnimatedGlassCard, StatusBadge, ProgressBar } from '@/components/ui/glass-components'
import { NavigationMode } from '@/components/layout/bottom-navigation'
import { cn } from '@/lib/utils'

export interface FloatingMetricsProps {
  currentMode: NavigationMode
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
}

interface MetricCard {
  id: string
  title: string
  value: string
  change?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon: React.ComponentType<{ className?: string }>
  status?: 'online' | 'offline' | 'warning' | 'info' | 'neutral'
  progress?: {
    value: number
    max: number
    label?: string
  }
  subtitle?: string
}

// Mock data that changes over time to simulate real-time updates
const generateMetricData = (mode: NavigationMode): MetricCard[] => {
  const now = Date.now()
  const variance = Math.sin(now / 10000) * 0.1 // Small oscillation for demo

  const baseMetrics: Record<NavigationMode, MetricCard[]> = {
    opportunities: [
      {
        id: 'total-opportunities',
        title: 'Active Opportunities',
        value: `${Math.floor(127 + variance * 10)}`,
        change: { value: '+12%', direction: 'up' },
        icon: Target,
        status: 'online',
        subtitle: 'Market zones'
      },
      {
        id: 'opportunity-value',
        title: 'Potential Value',
        value: `$${(4.2 + variance).toFixed(1)}M`,
        change: { value: '+8.5%', direction: 'up' },
        icon: DollarSign,
        status: 'online',
        subtitle: 'Monthly potential'
      },
      {
        id: 'coverage-score',
        title: 'Coverage Score',
        value: `${Math.floor(87 + variance * 5)}%`,
        icon: Globe,
        progress: { value: 87 + variance * 5, max: 100 },
        subtitle: 'Geographic reach'
      }
    ],
    utilization: [
      {
        id: 'active-stations',
        title: 'Active Stations',
        value: `${Math.floor(47 + variance * 3)}`,
        change: { value: '+2', direction: 'up' },
        icon: Radio,
        status: 'online',
        subtitle: 'Currently online'
      },
      {
        id: 'utilization-rate',
        title: 'Utilization Rate',
        value: `${Math.floor(84 + variance * 5)}%`,
        icon: Activity,
        progress: { value: 84 + variance * 5, max: 100 },
        subtitle: 'Average capacity'
      },
      {
        id: 'throughput',
        title: 'Data Throughput',
        value: `${(12.4 + variance).toFixed(1)} GB/s`,
        change: { value: '+15%', direction: 'up' },
        icon: Zap,
        status: 'online',
        subtitle: 'Network wide'
      }
    ],
    revenue: [
      {
        id: 'monthly-revenue',
        title: 'Monthly Revenue',
        value: `$${(2.4 + variance * 0.1).toFixed(1)}M`,
        change: { value: '+12.3%', direction: 'up' },
        icon: DollarSign,
        status: 'online',
        subtitle: 'Current month'
      },
      {
        id: 'profit-margin',
        title: 'Profit Margin',
        value: `${Math.floor(34 + variance * 3)}%`,
        change: { value: '+2.1%', direction: 'up' },
        icon: TrendingUp,
        status: 'online',
        subtitle: 'Operating margin'
      },
      {
        id: 'revenue-per-station',
        title: 'Revenue/Station',
        value: `$${Math.floor(51000 + variance * 1000).toLocaleString()}`,
        icon: Target,
        subtitle: 'Monthly average'
      }
    ],
    maritime: [
      {
        id: 'tracked-vessels',
        title: 'Tracked Vessels',
        value: `${Math.floor(1247 + variance * 50).toLocaleString()}`,
        change: { value: '+23', direction: 'up' },
        icon: Ship,
        status: 'info',
        subtitle: 'Currently visible'
      },
      {
        id: 'maritime-coverage',
        title: 'Maritime Coverage',
        value: `${Math.floor(92 + variance * 3)}%`,
        icon: Globe,
        progress: { value: 92 + variance * 3, max: 100 },
        subtitle: 'Ocean coverage'
      },
      {
        id: 'vessel-communications',
        title: 'Active Comms',
        value: `${Math.floor(834 + variance * 30)}`,
        change: { value: '+5.2%', direction: 'up' },
        icon: Radio,
        status: 'online',
        subtitle: 'Live connections'
      }
    ],
    satellites: [
      {
        id: 'tracked-satellites',
        title: 'Tracked Satellites',
        value: `${Math.floor(2891 + variance * 20).toLocaleString()}`,
        icon: Satellite,
        subtitle: 'In constellation'
      },
      {
        id: 'satellite-health',
        title: 'Fleet Health',
        value: `${Math.floor(96 + variance * 2)}%`,
        icon: Activity,
        status: 'online',
        progress: { value: 96 + variance * 2, max: 100 },
        subtitle: 'System status'
      },
      {
        id: 'passes-today',
        title: 'Passes Today',
        value: `${Math.floor(456 + variance * 20)}`,
        change: { value: '+12', direction: 'up' },
        icon: Eye,
        status: 'online',
        subtitle: 'Observation passes'
      }
    ]
  }

  return baseMetrics[mode] || []
}

export const FloatingMetrics: React.FC<FloatingMetricsProps> = ({
  currentMode,
  position = 'top-left',
  className
}) => {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [bottomNavHovered, setBottomNavHovered] = useState(false)

  // Update metrics based on current mode
  useEffect(() => {
    setMetrics(generateMetricData(currentMode))
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(generateMetricData(currentMode))
    }, 3000)

    return () => clearInterval(interval)
  }, [currentMode])

  const positionClasses = {
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-24 left-4',
    'bottom-right': 'bottom-24 right-4'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  }

  return (
    <>
      {/* Top Left Metrics - Adjusted positioning */}
      <div className="absolute top-20 left-4 z-30 space-y-2 max-w-[240px]">
        {/* Collapsible container */}
        <motion.div
          animate={{ 
            opacity: bottomNavHovered ? 0.3 : 1,
            scale: bottomNavHovered ? 0.95 : 1 
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Compact header */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-between bg-black/20 backdrop-blur-xl 
                     border border-white/10 rounded-xl px-3 py-2 mb-2
                     hover:bg-white/5 transition-all duration-200"
          >
            <span className="text-xs text-gray-400 uppercase tracking-wider">Metrics</span>
            <svg 
              className={cn('w-3 h-3 text-gray-400 transition-transform', collapsed ? 'rotate-180' : '')} 
              fill="none" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Metric cards */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {metrics.slice(0, 3).map((metric, index) => (
                  <CompactMetricCard
                    key={metric.id}
                    icon={metric.icon}
                    label={metric.title}
                    value={metric.value}
                    trend={metric.change?.value}
                    subtitle={metric.subtitle}
                    color={index === 0 ? 'green' : index === 1 ? 'blue' : 'purple'}
                  />
                ))}

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Issue indicator - Bottom left, above navigation */}
      <div className="absolute bottom-20 left-4 z-30">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-xl px-3 py-2
                   flex items-center space-x-2 max-w-[200px]"
        >
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-red-400">1 Issue</span>
          <button className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      </div>
    </>
  )
}

// Compact Metric Card Component
interface CompactMetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend?: string
  subtitle?: string
  color?: 'green' | 'blue' | 'purple' | 'yellow'
}

const CompactMetricCard: React.FC<CompactMetricCardProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  subtitle, 
  color = 'blue' 
}) => {
  const colorClasses = {
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    blue: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'bg-gradient-to-r',
        colorClasses[color],
        'backdrop-blur-xl border rounded-xl p-3',
        'cursor-pointer transition-all duration-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Icon className="w-4 h-4 text-white" />
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
          </div>
          <p className="text-white text-xl font-light">{value}</p>
          {subtitle && (
            <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={cn(
            'text-[10px]',
            trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
          )}>
            {trend}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default FloatingMetrics