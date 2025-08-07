/**
 * Competitor Filter Component
 * Allows filtering ground stations by operator
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CompetitorFilterProps {
  selectedOperators: string[]
  onOperatorChange: (operators: string[]) => void
  className?: string
}

const operators = [
  { id: 'SES', label: 'SES', color: '#3B82F6', count: 32, icon: 'fa-satellite-dish' },
  { id: 'AWS', label: 'AWS', color: '#FF9900', count: 10, icon: 'fa-cloud' },
  { id: 'Telesat', label: 'Telesat', color: '#9C27B0', count: 5, icon: 'fa-satellite' },
  { id: 'SpaceX', label: 'SpaceX', color: '#00BCD4', count: 5, icon: 'fa-rocket' },
  { id: 'KSAT', label: 'KSAT', color: '#FFEB3B', count: 4, icon: 'fa-globe' },
  { id: 'Viasat', label: 'Viasat', color: '#6A1B9A', count: 3, icon: 'fa-wifi' },
  { id: 'Eutelsat', label: 'Eutelsat', color: '#2196F3', count: 3, icon: 'fa-broadcast-tower' },
  { id: 'OneWeb', label: 'OneWeb', color: '#4CAF50', count: 3, icon: 'fa-network-wired' }
]

const CompetitorFilter: React.FC<CompetitorFilterProps> = ({
  selectedOperators,
  onOperatorChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)
  
  const handleOperatorToggle = (operatorId: string) => {
    const updated = selectedOperators.includes(operatorId)
      ? selectedOperators.filter(op => op !== operatorId)
      : [...selectedOperators, operatorId]
    
    onOperatorChange(updated)
  }
  
  const handleToggleAll = () => {
    if (showAll) {
      // Show only SES
      onOperatorChange(['SES'])
      setShowAll(false)
    } else {
      // Show all operators
      onOperatorChange(operators.map(op => op.id))
      setShowAll(true)
    }
  }
  
  return (
    <motion.div 
      className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <i className="fas fa-filter text-white text-sm" />
          <span className="text-white text-xs font-medium uppercase tracking-wider">
            Operators
          </span>
          <span className="text-gray-500 text-xs">
            ({selectedOperators.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {showAll ? 'Show SES Only' : 'Show All'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`} />
          </button>
        </div>
      </div>
      
      {/* Operator List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
              {operators.map(op => {
                const isSelected = selectedOperators.includes(op.id)
                const isSES = op.id === 'SES'
                
                return (
                  <motion.label
                    key={op.id}
                    whileHover={{ scale: 1.02 }}
                    className={`
                      flex items-center justify-between p-2 rounded-lg 
                      cursor-pointer transition-all duration-200
                      ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
                      ${isSES ? 'border border-blue-500/30' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleOperatorToggle(op.id)}
                          className="sr-only"
                        />
                        <div 
                          className={`
                            w-4 h-4 rounded border-2 transition-all duration-200
                            ${isSelected 
                              ? 'bg-white border-white' 
                              : 'bg-transparent border-gray-500 hover:border-gray-400'
                            }
                          `}
                        >
                          {isSelected && (
                            <i className="fas fa-check text-black text-xs absolute inset-0 flex items-center justify-center" />
                          )}
                        </div>
                      </div>
                      
                      {/* Color indicator */}
                      <div
                        className="w-3 h-3 rounded-full shadow-lg"
                        style={{ 
                          backgroundColor: op.color,
                          boxShadow: isSelected ? `0 0 10px ${op.color}` : 'none'
                        }}
                      />
                      
                      {/* Icon and Label */}
                      <div className="flex items-center gap-2">
                        <i className={`fas ${op.icon} text-xs`} style={{ color: op.color }} />
                        <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {op.label}
                        </span>
                        {isSES && (
                          <span className="text-xs text-blue-400 font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Station count */}
                    <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {op.count}
                    </span>
                  </motion.label>
                )
              })}
            </div>
            
            {/* Summary */}
            <div className="px-3 py-2 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Total Stations:
                </span>
                <span className="text-white font-medium">
                  {operators
                    .filter(op => selectedOperators.includes(op.id))
                    .reduce((sum, op) => sum + op.count, 0)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CompetitorFilter