'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Column } from '@/lib/paperwm/ColumnManager'

interface PipelineInvestigationProps {
  issueId: string
  onAddColumn?: (column: Partial<Column>) => void
  onFocusColumn?: (id: string) => void
}

export function PipelineInvestigation({ issueId, onAddColumn, onFocusColumn }: PipelineInvestigationProps) {
  const [applyingFix, setApplyingFix] = useState(false)

  // Mock investigation data based on issueId
  const investigation = {
    title: 'CUSTOMER ETL PIPELINE INVESTIGATION',
    rootCause: {
      type: 'Schema Drift Detected',
      field: 'customer.email',
      change: 'VARCHAR(50) → VARCHAR(100)',
      firstOccurred: '6 hours ago'
    },
    businessImpact: [
      '14,592 customer records affected',
      '3 downstream systems impacted',
      'Sales dashboard showing stale data'
    ],
    recommendedFix: {
      confidence: 95,
      steps: [
        'Update ETL schema mapping',
        'Add field length validation',
        'Backfill truncated records'
      ],
      estimatedTime: '5 minutes'
    }
  }

  const handleApplyFix = () => {
    setApplyingFix(true)
    
    // Add testing column to the right
    if (onAddColumn) {
      onAddColumn({
        id: 'testing-validation',
        title: 'Testing & Validation',
        component: 'TestingValidation',
        props: { issueId },
        width: 600
      })
    }
    
    setTimeout(() => {
      setApplyingFix(false)
    }, 2000)
  }

  const handleManualReview = () => {
    if (onAddColumn) {
      onAddColumn({
        id: 'technical-details',
        title: 'Technical Details',
        component: 'TechnicalDetails',
        props: { issueId },
        width: 800
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8 text-white">
      <h1 className="text-2xl font-light mb-8 tracking-wide flex items-center gap-3">
        <span className="text-3xl">🔍</span>
        {investigation.title}
      </h1>

      {/* Automated Analysis */}
      <div className="mb-8">
        <h2 className="text-lg text-[#94a3b8] mb-4">AUTOMATED ANALYSIS COMPLETE:</h2>
        
        <div className="border border-[#334155] rounded-lg p-6 bg-[#0f172a]/80 mb-6">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            <span>📋</span> Root Cause Identified
          </h3>
          
          <div className="space-y-2 text-[#94a3b8]">
            <div className="flex items-center gap-2">
              <span>📋</span> {investigation.rootCause.type}
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span> Field: {investigation.rootCause.field}
            </div>
            <div className="flex items-center gap-2">
              <span>📏</span> Changed: {investigation.rootCause.change}
            </div>
            <div className="flex items-center gap-2">
              <span>⏰</span> First occurred: {investigation.rootCause.firstOccurred}
            </div>
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="mb-8">
        <h2 className="text-lg text-[#94a3b8] mb-4">BUSINESS IMPACT:</h2>
        <div className="space-y-2 text-white">
          {investigation.businessImpact.map((impact, idx) => (
            <div key={idx}>• {impact}</div>
          ))}
        </div>
      </div>

      {/* Recommended Fix */}
      <div className="mb-8">
        <div className="border border-[#22c55e] rounded-lg p-6 bg-[#22c55e]/5">
          <h3 className="text-lg mb-4 flex items-center gap-2">
            RECOMMENDED FIX 
            <span className="text-sm text-[#94a3b8]">({investigation.recommendedFix.confidence}% confidence)</span>
          </h3>
          
          <div className="space-y-2 text-[#94a3b8] mb-4">
            {investigation.recommendedFix.steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[#22c55e]">✅</span> {step}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-[#64748b] flex items-center gap-2">
            <span>⏱️</span> Estimated time: {investigation.recommendedFix.estimatedTime}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={handleApplyFix}
          disabled={applyingFix}
          className={cn(
            "px-6 py-3 rounded-md transition-all",
            applyingFix 
              ? "bg-[#64748b] cursor-not-allowed" 
              : "bg-white text-black hover:bg-[#94a3b8]"
          )}
        >
          {applyingFix ? 'Applying Fix...' : 'Apply Automated Fix'}
        </button>
        
        <button 
          onClick={handleManualReview}
          className="px-6 py-3 border border-[#334155] rounded-md hover:bg-[#334155] transition-colors"
        >
          Manual Review
        </button>
        
        <button 
          onClick={() => {
            if (onAddColumn) {
              onAddColumn({
                id: 'technical-logs',
                title: 'View Technical Details',
                component: 'TechnicalDetails',
                props: { issueId, showLogs: true },
                width: 800
              })
            }
          }}
          className="px-6 py-3 border border-[#334155] rounded-md hover:bg-[#334155] transition-colors"
        >
          View Technical Details
        </button>
      </div>

      {/* Navigation Hint */}
      <div className="mt-12 text-right text-[#64748b] text-sm">
        Next: Testing → <span className="text-[#94a3b8]">(peek)</span>
      </div>
    </div>
  )
}