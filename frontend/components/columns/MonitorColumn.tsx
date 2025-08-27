'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Column } from '@/lib/paperwm/ColumnManager'

interface MonitorColumnProps {
  onAddColumn?: (column: Partial<Column>) => void
  onFocusColumn?: (id: string) => void
}

export function MonitorColumn({ onAddColumn, onFocusColumn }: MonitorColumnProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const excellentProducts = [
    { name: 'Sales Analytics', metric: '1,247 daily queries' },
    { name: 'Customer Segments', metric: '99.9% uptime' },
    { name: 'Financial Reports', metric: '94% quality score' }
  ]

  const needsAttention = [
    {
      id: 'inventory-trends',
      title: 'Inventory Trends',
      issue: 'Query performance degraded 23%',
      icon: '🐌',
      details: [
        { icon: '📅', text: 'Last 7 days - usage increased 40%' },
        { icon: '💡', text: 'Index optimization recommended' }
      ],
      action: 'Optimize Performance'
    }
  ]

  const criticalIssues = [
    { name: 'Legacy Reports Suite', issue: 'deprecated dependencies' },
    { name: 'Pricing Calculator', issue: 'schema validation failing' }
  ]

  const usageTrends = [
    { label: 'Overall queries', value: '↗ +15% this week' },
    { label: 'New users onboarded', value: '23' },
    { label: 'Average response time', value: '1.2s (target: <2s)' }
  ]

  const handleOptimize = (productId: string) => {
    if (onAddColumn) {
      onAddColumn({
        id: `optimize-${productId}`,
        title: 'Performance Optimizer',
        component: 'PerformanceOptimizer',
        props: { productId },
        width: 800
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8 text-white">
      <h1 className="text-4xl font-light mb-12 tracking-wide font-['Reckless_Trial']">
        WHAT TO MONITOR
      </h1>

      {/* Production Health */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📊</span>
          <h2 className="text-xl text-[#94a3b8]">PRODUCTION HEALTH (23 products)</h2>
        </div>

        {/* Excellent */}
        <div className="mb-8">
          <h3 className="text-lg text-[#22c55e] mb-4">✅ EXCELLENT (18)</h3>
          <div className="space-y-2 text-[#64748b]">
            {excellentProducts.map((product, idx) => (
              <div key={idx}>
                • {product.name} - {product.metric}
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="mb-8">
          <h3 className="text-lg text-[#f59e0b] mb-4">⚠️ NEEDS ATTENTION (3)</h3>
          <div className="space-y-6">
            {needsAttention.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "border border-[#f59e0b] rounded-lg p-6 bg-[#f59e0b]/5 transition-all duration-300",
                  expandedCard === product.id && "scale-[1.02]"
                )}
                onMouseEnter={() => setExpandedCard(product.id)}
                onMouseLeave={() => setExpandedCard(null)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-lg">{product.title}</h4>
                  <span className="text-xl">{product.icon}</span>
                </div>
                
                <div className="text-[#94a3b8] mb-4">{product.issue}</div>
                
                <div className="space-y-2 mb-6">
                  {product.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[#64748b]">
                      <span>{detail.icon}</span>
                      <span className="text-sm">{detail.text}</span>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleOptimize(product.id)}
                  className="px-6 py-3 bg-white text-black rounded-md hover:bg-[#94a3b8] transition-colors"
                >
                  {product.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Issues */}
        <div className="mb-8">
          <h3 className="text-lg text-[#ef4444] mb-4">❌ CRITICAL ISSUES (2)</h3>
          <div className="space-y-2 text-[#94a3b8]">
            {criticalIssues.map((issue, idx) => (
              <div 
                key={idx}
                className="cursor-pointer hover:text-white transition-colors"
                onClick={() => {
                  if (onAddColumn) {
                    onAddColumn({
                      id: `fix-${idx}`,
                      title: 'Issue Resolution',
                      component: 'QualityMonitor',
                      props: { issue },
                      width: 800
                    })
                  }
                }}
              >
                • {issue.name} - {issue.issue}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Trends */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📈</span>
          <h2 className="text-xl text-[#94a3b8]">USAGE TRENDS</h2>
        </div>
        
        <div className="space-y-3">
          {usageTrends.map((trend, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-[#1e293b] rounded-lg bg-[#0f172a]/60">
              <span className="text-[#64748b]">• {trend.label}:</span>
              <span className="text-white">{trend.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}