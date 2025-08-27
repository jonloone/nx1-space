'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Column } from '@/lib/paperwm/ColumnManager'

interface AttentionColumnProps {
  onAddColumn?: (column: Partial<Column>) => void
  onFocusColumn?: (id: string) => void
}

export function AttentionColumn({ onAddColumn, onFocusColumn }: AttentionColumnProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const urgentIssues = [
    {
      id: 'pipeline-failure',
      title: 'Customer ETL Pipeline Failed',
      icon: '🚨',
      metrics: [
        { label: 'Failed', value: '3 times in last 6 hours', icon: '⏰' },
        { label: 'Records affected', value: '14,592', icon: '📊' },
        { label: 'Root cause', value: 'Likely schema drift - auto-fix available', icon: '🎯' }
      ],
      action: 'Investigate & Fix',
      severity: 'critical'
    },
    {
      id: 'memory-usage',
      title: 'Memory Usage at 82%',
      icon: '⚠️',
      metrics: [
        { label: 'Status', value: 'Approaching critical threshold (85%)', icon: '⚠️' },
        { label: 'Trend', value: 'Increased 15% in last 2 hours', icon: '📈' },
        { label: 'Solution', value: 'Optimization recommendations available', icon: '💡' }
      ],
      action: 'View Optimization Options',
      severity: 'warning'
    }
  ]

  const opportunities = [
    {
      id: 'query-optimization',
      title: 'Product dimension query can be 40% faster',
      action: 'Quick optimization - 5 min estimated'
    }
  ]

  const healthySystems = {
    connections: 15,
    pipelines: 5,
    dataProducts: 23
  }

  const handleInvestigate = (issueId: string) => {
    if (onAddColumn) {
      // Add investigation column to the right
      onAddColumn({
        id: `investigate-${issueId}`,
        title: 'Investigation',
        component: 'PipelineInvestigation',
        props: { issueId },
        width: 800
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8 text-white">
      <h1 className="text-4xl font-light mb-12 tracking-wide font-['Reckless_Trial']">
        WHAT NEEDS ATTENTION
      </h1>

      {/* Urgent Issues */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🚨</span>
          <h2 className="text-xl text-[#94a3b8]">URGENT ISSUES ({urgentIssues.length})</h2>
        </div>
        
        <div className="space-y-6">
          {urgentIssues.map((issue) => (
            <div
              key={issue.id}
              className={cn(
                "border rounded-lg p-6 transition-all duration-300",
                issue.severity === 'critical' 
                  ? "border-[#ef4444] bg-[#ef4444]/5"
                  : "border-[#f59e0b] bg-[#f59e0b]/5",
                expandedCard === issue.id && "scale-[1.02]"
              )}
              onMouseEnter={() => setExpandedCard(issue.id)}
              onMouseLeave={() => setExpandedCard(null)}
            >
              <h3 className="text-xl mb-4">{issue.title}</h3>
              
              <div className="space-y-2 mb-6">
                {issue.metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{metric.icon}</span>
                    <span className="text-[#94a3b8]">{metric.value}</span>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => handleInvestigate(issue.id)}
                className="px-6 py-3 bg-white text-black rounded-md hover:bg-[#94a3b8] transition-colors"
              >
                {issue.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">⚡</span>
          <h2 className="text-xl text-[#94a3b8]">OPPORTUNITIES ({opportunities.length})</h2>
        </div>
        
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="flex items-center justify-between p-4 border border-[#334155] rounded-lg bg-[#0f172a]/80">
              <span className="text-[#94a3b8]">• {opp.title}</span>
              <button 
                onClick={() => handleInvestigate(opp.id)}
                className="text-sm px-4 py-2 border border-[#334155] rounded hover:bg-[#334155] transition-colors"
              >
                [{opp.action}]
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All Systems Running Well */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">✅</span>
          <h2 className="text-xl text-[#22c55e]">ALL SYSTEMS RUNNING WELL</h2>
        </div>
        
        <div className="space-y-2 text-[#64748b]">
          <div>• {healthySystems.connections} connections healthy</div>
          <div>• {healthySystems.pipelines} pipelines processing normally</div>
          <div>• {healthySystems.dataProducts} data products in production</div>
        </div>
      </div>
    </div>
  )
}