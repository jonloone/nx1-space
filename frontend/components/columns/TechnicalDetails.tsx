'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TechnicalDetailsProps {
  issueId: string
  showLogs?: boolean
  onAddColumn?: (column: any) => void
  onFocusColumn?: (id: string) => void
}

export function TechnicalDetails({ issueId, showLogs }: TechnicalDetailsProps) {
  const technicalInfo = {
    pipeline: 'ETL_CUSTOMER_MASTER_V3',
    lastRun: '2024-01-26 14:23:00 UTC',
    executionTime: '3h 27m',
    errorLocation: 'Stage 3: Transform',
    affectedTables: [
      'customer.master_table',
      'customer.address_lookup',
      'customer.contact_details'
    ],
    errorTrace: `
SchemaValidationError at line 1247:
  Expected: VARCHAR(50)
  Received: VARCHAR(100)
  Field: customer_email
  
Stack trace:
  at validateSchema (transform.py:1247)
  at processRecord (transform.py:892)
  at batchTransform (transform.py:234)
  at main (etl_runner.py:67)
    `,
    suggestedFix: {
      code: `ALTER TABLE customer.master_table 
MODIFY COLUMN customer_email VARCHAR(100);

-- Update validation rules
UPDATE pipeline_config 
SET validation_rules = '{"email": {"maxLength": 100}}' 
WHERE pipeline_id = 'ETL_CUSTOMER_MASTER_V3';`,
      description: 'Update schema and validation rules to accommodate new field length'
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8 text-white">
      <h1 className="text-2xl font-light mb-8 tracking-wide flex items-center gap-3">
        <span className="text-3xl">🔧</span>
        TECHNICAL DETAILS
      </h1>

      {/* Pipeline Information */}
      <div className="mb-8">
        <h2 className="text-lg text-[#94a3b8] mb-4">PIPELINE INFORMATION:</h2>
        <div className="space-y-2 text-[#94a3b8]">
          <div>• Pipeline: <span className="text-white font-mono">{technicalInfo.pipeline}</span></div>
          <div>• Last Run: {technicalInfo.lastRun}</div>
          <div>• Execution Time: {technicalInfo.executionTime}</div>
          <div>• Error Location: <span className="text-[#f59e0b]">{technicalInfo.errorLocation}</span></div>
        </div>
      </div>

      {/* Affected Tables */}
      <div className="mb-8">
        <h2 className="text-lg text-[#94a3b8] mb-4">AFFECTED TABLES:</h2>
        <div className="space-y-2">
          {technicalInfo.affectedTables.map((table, idx) => (
            <div key={idx} className="font-mono text-sm bg-[#0f172a] p-2 rounded border border-[#334155]">
              {table}
            </div>
          ))}
        </div>
      </div>

      {/* Error Trace */}
      {showLogs && (
        <div className="mb-8">
          <h2 className="text-lg text-[#ef4444] mb-4">ERROR TRACE:</h2>
          <pre className="bg-[#0f172a] border border-[#ef4444]/20 rounded-lg p-4 text-xs text-[#ef4444] overflow-x-auto">
            {technicalInfo.errorTrace.trim()}
          </pre>
        </div>
      )}

      {/* Suggested Fix */}
      <div className="mb-8">
        <h2 className="text-lg text-[#22c55e] mb-4">SUGGESTED FIX:</h2>
        <div className="mb-4 text-[#94a3b8]">{technicalInfo.suggestedFix.description}</div>
        <pre className="bg-[#0f172a] border border-[#22c55e]/20 rounded-lg p-4 text-xs text-[#22c55e] overflow-x-auto">
          {technicalInfo.suggestedFix.code.trim()}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="px-6 py-3 bg-white text-black rounded-md hover:bg-[#94a3b8] transition-colors">
          Apply Fix
        </button>
        <button className="px-6 py-3 border border-[#334155] rounded-md hover:bg-[#334155] transition-colors">
          Copy SQL
        </button>
        <button className="px-6 py-3 border border-[#334155] rounded-md hover:bg-[#334155] transition-colors">
          View Full Logs
        </button>
      </div>
    </div>
  )
}