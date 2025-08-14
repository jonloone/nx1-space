'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CompetitorFilterProps {
  filters: {
    showSES: boolean
    showViasat: boolean
    showSpaceX: boolean
    showOthers: boolean
  }
  onFilterChange: (operator: string, value: boolean) => void
  visible: boolean
}

const CompetitorFilter: React.FC<CompetitorFilterProps> = ({ 
  filters, 
  onFilterChange,
  visible 
}) => {
  if (!visible) return null

  const operators = [
    { key: 'showSES', label: 'SES (merged with Intelsat)', color: 'bg-green-500' },
    { key: 'showViasat', label: 'Viasat', color: 'bg-purple-500' },
    { key: 'showSpaceX', label: 'SpaceX', color: 'bg-violet-500' },
    { key: 'showOthers', label: 'Others', color: 'bg-indigo-500' }
  ]

  const toggleAll = () => {
    const allChecked = Object.values(filters).every(v => v)
    operators.forEach(op => {
      onFilterChange(op.key, !allChecked)
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="absolute left-4 top-24 z-30"
      >
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">Operators</h3>
            <button
              onClick={toggleAll}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {Object.values(filters).every(v => v) ? 'Hide All' : 'Show All'}
            </button>
          </div>
          
          <div className="space-y-2">
            {operators.map(operator => (
              <label
                key={operator.key}
                className="flex items-center space-x-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters[operator.key as keyof typeof filters]}
                  onChange={(e) => onFilterChange(operator.key, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-500 
                           focus:ring-blue-500 focus:ring-offset-0"
                />
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${operator.color}`} />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {operator.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="text-xs text-gray-400">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>High Profit (&gt;25%)</span>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Low Profit (0-10%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Loss</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CompetitorFilter