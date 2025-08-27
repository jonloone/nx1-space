'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Column } from '@/lib/paperwm/ColumnManager'

interface BuildColumnProps {
  onAddColumn?: (column: Partial<Column>) => void
  onFocusColumn?: (id: string) => void
  onShowPipeline?: () => void
}

export function BuildColumn({ onAddColumn, onFocusColumn, onShowPipeline }: BuildColumnProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const inProgressProducts = [
    {
      id: 'customer-360',
      title: 'Customer 360',
      stage: 'Semantic stage',
      progress: 73,
      icon: '📊',
      details: [
        { icon: '👥', text: 'Sales team waiting for business context' },
        { icon: '⏰', text: 'ETA: 3 weeks' }
      ],
      action: 'Continue Building'
    },
    {
      id: 'risk-analytics',
      title: 'Risk Analytics',
      stage: 'Processing stage - needs quality rules',
      progress: 45,
      icon: '🔧',
      details: [
        { icon: '📈', text: '2.3M records ready for transformation' },
        { icon: '⏰', text: 'ETA: 1 week' }
      ],
      action: 'Set Quality Rules'
    }
  ]

  const suggestedBuilds = [
    {
      id: 'marketing-attribution',
      title: 'Marketing Campaign Attribution',
      reason: 'Based on recent data requests from marketing team'
    },
    {
      id: 'support-intelligence', 
      title: 'Support Ticket Intelligence',
      reason: 'High-value opportunity - 40 hours/week analyst time'
    }
  ]

  const handleContinueBuilding = (productId: string) => {
    if (onAddColumn) {
      onAddColumn({
        id: `build-${productId}`,
        title: 'Data Product Builder',
        component: 'DataProductBuilder',
        props: { productId },
        width: 800
      })
    }
    if (onShowPipeline) {
      onShowPipeline()
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8 text-white">
      <h1 className="text-4xl font-light mb-12 tracking-wide font-['Reckless_Trial']">
        WHAT TO BUILD
      </h1>

      {/* In Progress Products */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🔨</span>
          <h2 className="text-xl text-[#94a3b8]">IN PROGRESS PRODUCTS ({inProgressProducts.length})</h2>
        </div>
        
        <div className="space-y-6">
          {inProgressProducts.map((product) => (
            <div
              key={product.id}
              className={cn(
                "border border-[#334155] rounded-lg p-6 bg-[#0f172a]/80 transition-all duration-300",
                expandedCard === product.id && "scale-[1.02] border-[#94a3b8]"
              )}
              onMouseEnter={() => setExpandedCard(product.id)}
              onMouseLeave={() => setExpandedCard(null)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl">{product.title}</h3>
                <span className="text-2xl">{product.icon}</span>
              </div>
              
              <div className="mb-4">
                <div className="text-[#94a3b8] mb-2">
                  {product.stage} - {product.progress}% complete
                </div>
                <div className="w-full bg-[#1e293b] rounded-full h-2">
                  <div 
                    className="bg-[#22c55e] h-full rounded-full transition-all duration-500"
                    style={{ width: `${product.progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {product.details.map((detail, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[#64748b]">
                    <span>{detail.icon}</span>
                    <span>{detail.text}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => handleContinueBuilding(product.id)}
                className="px-6 py-3 bg-white text-black rounded-md hover:bg-[#94a3b8] transition-colors"
              >
                {product.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Builds */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">💡</span>
          <h2 className="text-xl text-[#94a3b8]">SUGGESTED BUILDS ({suggestedBuilds.length})</h2>
        </div>
        
        <div className="space-y-4">
          {suggestedBuilds.map((build) => (
            <div key={build.id} className="p-4 border border-[#1e293b] rounded-lg bg-[#0f172a]/60">
              <div className="text-white mb-1">• {build.title}</div>
              <div className="text-sm text-[#64748b] ml-4">{build.reason}</div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => {
            if (onAddColumn) {
              onAddColumn({
                id: 'new-product',
                title: 'New Data Product',
                component: 'DataProductBuilder',
                props: { isNew: true },
                width: 800
              })
            }
          }}
          className="mt-6 px-6 py-3 border border-[#334155] rounded-md hover:bg-[#334155] transition-colors"
        >
          [+ New Data Product]
        </button>
      </div>
    </div>
  )
}