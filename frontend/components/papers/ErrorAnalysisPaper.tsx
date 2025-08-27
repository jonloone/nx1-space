'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ErrorAnalysisPaperProps {
  paperId: string;
  state: any;
  workflowState: any;
  adjacentPapers: any;
  onSpawnPaper: (config: any) => void;
  onUpdateState: (updates: any) => void;
  onUpdateWorkflowState?: (state: any) => void;
  onNavigate: (paperId: string) => void;
}

export function ErrorAnalysisPaper({ 
  state, 
  workflowState,
  onSpawnPaper, 
  onUpdateState,
  onUpdateWorkflowState 
}: ErrorAnalysisPaperProps) {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  
  // Mock error data
  const errorData = {
    pipeline: 'customer_etl_pipeline_v3',
    failureTime: '2024-01-26 14:23:00 UTC',
    failureCount: 3,
    lastSuccess: '2024-01-26 08:00:00 UTC',
    errorType: 'SchemaValidationError',
    affectedSystems: 12,
    stackTrace: `SchemaValidationError at line 1247:
  Expected: VARCHAR(50)
  Received: VARCHAR(100)
  Field: customer_email
  
Stack trace:
  at validateSchema (transform.py:1247)
  at processRecord (transform.py:892)
  at batchTransform (transform.py:234)
  at main (etl_runner.py:67)
  
Resource usage at failure:
  CPU: 87%
  Memory: 6.2GB/8GB
  Disk I/O: 234 MB/s
  
Concurrent operations:
  - inventory_sync_job (running)
  - product_catalog_refresh (completed)
  - order_processing_pipeline (queued)`,
    logs: [
      { time: '14:22:58', level: 'INFO', message: 'Starting batch transformation' },
      { time: '14:23:00', level: 'ERROR', message: 'Schema validation failed for customer_email field' },
      { time: '14:23:01', level: 'ERROR', message: 'Pipeline terminated with exit code 1' }
    ]
  };
  
  // Simulate AI analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      setAiAnalysis({
        rootCause: 'Database schema change in source system increased email field length from 50 to 100 characters',
        confidence: 92,
        similarIncidents: [
          { id: 'inc-234', date: '2024-01-15', resolution: 'Updated schema validation rules' },
          { id: 'inc-198', date: '2023-12-20', resolution: 'Modified transformation logic' }
        ],
        impact: {
          severity: 'high',
          affectedRecords: 45000,
          downstreamDelay: '3-4 hours',
          revenueImpact: '$12,000 potential'
        },
        recommendations: [
          { 
            action: 'Auto-fix schema validation',
            confidence: 88,
            implementation: 'Update VARCHAR length in SQLMesh model',
            risk: 'low'
          },
          {
            action: 'Manual schema investigation',
            confidence: 95,
            implementation: 'Deep dive into source system changes',
            risk: 'none'
          }
        ]
      });
      setIsAnalyzing(false);
      
      // Update workflow state
      if (onUpdateWorkflowState) {
        onUpdateWorkflowState({
          errorType: 'SchemaValidationError',
          pipeline: 'customer_etl_pipeline_v3',
          rootCause: 'Schema field length mismatch'
        });
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [onUpdateWorkflowState]);

  return (
    <div className="h-full flex flex-col">
      {/* Error Context Header */}
      <div className="px-6 py-4 bg-red-500/5 border-b border-red-500/20">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium text-white mb-1">
              Pipeline Failure: {errorData.pipeline}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="text-red-400">Failed {errorData.failureCount} times</span>
              <span>Since {errorData.failureTime}</span>
              <span className="text-yellow-400">{errorData.affectedSystems} systems impacted</span>
            </div>
          </div>
          {aiAnalysis && (
            <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded text-sm">
              AI Confidence: {aiAnalysis.confidence}%
            </div>
          )}
        </div>
      </div>
      
      {/* Technical Analysis Center */}
      <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-y-auto">
        {/* Left Half: Raw Error Data */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <span className="text-red-500">⚡</span> Stack Trace & Diagnostics
            </h2>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs">
              <pre className="text-red-400 whitespace-pre-wrap">{errorData.stackTrace}</pre>
            </div>
          </div>
          
          <div>
            <h2 className="text-sm font-medium text-white mb-3">Log Correlation</h2>
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              {errorData.logs.map((log, index) => (
                <div key={index} className="flex gap-3 text-xs font-mono">
                  <span className="text-gray-500">{log.time}</span>
                  <span className={cn(
                    'font-medium',
                    log.level === 'ERROR' ? 'text-red-400' : 'text-gray-400'
                  )}>
                    [{log.level}]
                  </span>
                  <span className="text-gray-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Half: AI Analysis */}
        <div className="space-y-6">
          {isAnalyzing ? (
            <div className="flex items-center justify-center h-full">
              <div className="space-y-3 text-center">
                <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-sm text-gray-400">AI analyzing error patterns...</div>
              </div>
            </div>
          ) : aiAnalysis && (
            <>
              <div>
                <h2 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <span className="text-blue-500">🤖</span> AI Root Cause Analysis
                </h2>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3">{aiAnalysis.rootCause}</p>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">
                      Similar incidents: {aiAnalysis.similarIncidents.length} found
                    </div>
                    {aiAnalysis.similarIncidents.map((incident: any) => (
                      <div key={incident.id} className="pl-4 text-xs text-gray-500">
                        • {incident.id} ({incident.date}): {incident.resolution}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-sm font-medium text-white mb-3">Impact Assessment</h2>
                <div className="bg-gray-900 rounded-lg p-4 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Severity</div>
                    <div className="text-sm text-yellow-400 font-medium uppercase">
                      {aiAnalysis.impact.severity}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Affected Records</div>
                    <div className="text-sm text-white font-medium">
                      {aiAnalysis.impact.affectedRecords.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Downstream Delay</div>
                    <div className="text-sm text-white font-medium">
                      {aiAnalysis.impact.downstreamDelay}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Revenue Impact</div>
                    <div className="text-sm text-red-400 font-medium">
                      {aiAnalysis.impact.revenueImpact}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Action Generation Footer */}
      <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800">
        <div className="flex items-center justify-between">
          {aiAnalysis && (
            <div className="flex gap-3">
              {aiAnalysis.recommendations.map((rec: any, index: number) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    if (rec.action.includes('schema')) {
                      onSpawnPaper({
                        type: 'investigation',
                        title: 'Schema Investigation',
                        componentKey: 'schema-investigation',
                        parentId: state.paperId,
                        initialState: { 
                          errorType: errorData.errorType,
                          recommendation: rec 
                        },
                        workflowId: workflowState?.workflowId
                      });
                    } else {
                      onSpawnPaper({
                        type: 'development',
                        title: 'Deploy Quick Fix',
                        componentKey: 'deployment-monitoring',
                        parentId: state.paperId,
                        initialState: { quickFix: rec },
                        workflowId: workflowState?.workflowId
                      });
                    }
                  }}
                  className={cn(
                    'px-4 py-2 rounded text-sm font-medium transition-colors',
                    index === 0 
                      ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <span>{rec.action}</span>
                    <span className="text-xs opacity-60">({rec.confidence}%)</span>
                  </div>
                  <div className="text-xs opacity-60 mt-0.5">Risk: {rec.risk}</div>
                </motion.button>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Press Alt+→ for next step</span>
          </div>
        </div>
      </div>
    </div>
  );
}