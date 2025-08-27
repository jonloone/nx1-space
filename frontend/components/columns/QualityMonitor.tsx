'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useAIColumnAssistant } from '@/hooks/useAIColumnAssistant';

interface QualityTest {
  id: string;
  name: string;
  dataset: string;
  status: 'passed' | 'failed' | 'running';
  issues?: number;
  lastRun: string;
  coverage: number;
}

interface DataDrift {
  id: string;
  dataset: string;
  type: 'schema' | 'distribution' | 'completeness';
  severity: 'low' | 'medium' | 'high';
  change: string;
  detected: string;
}

interface QualityIssue {
  id: string;
  dataset: string;
  issue: string;
  severity: 'critical' | 'warning' | 'info';
  affected: string;
  autoFixable: boolean;
  status: 'open' | 'fixing' | 'resolved';
}

export function QualityMonitor() {
  const { handleAICommand } = useAIColumnAssistant();
  
  const [qualityTests] = useState<QualityTest[]>([
    {
      id: '1',
      name: 'Customer Data Validation',
      dataset: 'customer_db',
      status: 'failed',
      issues: 3,
      lastRun: '10 min ago',
      coverage: 94
    },
    {
      id: '2',
      name: 'Product Integrity Check',
      dataset: 'product_catalog',
      status: 'passed',
      lastRun: '1 hour ago',
      coverage: 100
    },
    {
      id: '3',
      name: 'Transaction Consistency',
      dataset: 'transaction_log',
      status: 'running',
      lastRun: 'Now',
      coverage: 67
    }
  ]);

  const [dataDrifts] = useState<DataDrift[]>([
    {
      id: '1',
      dataset: 'customer_db',
      type: 'schema',
      severity: 'high',
      change: 'Column "email" changed from required to optional',
      detected: '2 hours ago'
    },
    {
      id: '2',
      dataset: 'sales_fact',
      type: 'distribution',
      severity: 'medium',
      change: '35% increase in NULL values for "discount_rate"',
      detected: '4 hours ago'
    },
    {
      id: '3',
      dataset: 'product_catalog',
      type: 'completeness',
      severity: 'low',
      change: 'Missing descriptions for 12 new products',
      detected: '6 hours ago'
    }
  ]);

  const [qualityIssues] = useState<QualityIssue[]>([
    {
      id: '1',
      dataset: 'customer_db',
      issue: '23% duplicate customer records',
      severity: 'critical',
      affected: '5.2K records',
      autoFixable: true,
      status: 'open'
    },
    {
      id: '2',
      dataset: 'transaction_log',
      issue: 'Invalid date formats',
      severity: 'warning',
      affected: '1.2K records',
      autoFixable: true,
      status: 'fixing'
    },
    {
      id: '3',
      dataset: 'product_catalog',
      issue: 'Orphaned category references',
      severity: 'warning',
      affected: '45 records',
      autoFixable: false,
      status: 'open'
    }
  ]);

  const [remediationProgress] = useState([
    { task: 'Deduplicating customers', progress: 45, eta: '5 min' },
    { task: 'Standardizing dates', progress: 78, eta: '2 min' },
    { task: 'Validating emails', progress: 12, eta: '15 min' }
  ]);

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high': return 'text-red-400';
      case 'warning':
      case 'medium': return 'text-yellow-400';
      case 'info':
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const handleTestClick = async (test: QualityTest) => {
    if (test.status === 'failed') {
      await handleAICommand({
        type: 'workflow',
        target: 'investigate_quality_failure',
        params: { testId: test.id, dataset: test.dataset }
      });
    }
  };

  const handleIssueClick = async (issue: QualityIssue) => {
    await handleAICommand({
      type: 'workflow',
      target: 'remediate_quality_issue',
      params: { issueId: issue.id, autoFixable: issue.autoFixable }
    });
  };

  const handleDriftClick = async (drift: DataDrift) => {
    await handleAICommand({
      type: 'workflow',
      target: 'analyze_data_drift',
      params: { driftId: drift.id, type: drift.type }
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-200">
      {/* Active Quality Tests */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Active Quality Tests</h3>
        <div className="space-y-2">
          {qualityTests.map(test => (
            <button
              key={test.id}
              onClick={() => handleTestClick(test)}
              className={cn(
                "w-full p-3 rounded-lg transition-all text-left",
                test.status === 'failed' 
                  ? "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30" 
                  : "bg-gray-900/50 hover:bg-gray-800/50"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{test.name}</span>
                <span className={cn("text-xs", getTestStatusColor(test.status))}>
                  {test.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{test.dataset}</span>
                <span>{test.coverage}% coverage</span>
              </div>
              {test.issues && (
                <div className="mt-2 text-xs text-red-400">
                  ⚠️ {test.issues} issues found - click to investigate
                </div>
              )}
              {test.status === 'running' && (
                <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 animate-pulse" style={{ width: `${test.coverage}%` }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data Drift Alerts */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Data Drift Alerts</h3>
        <div className="space-y-2">
          {dataDrifts.map(drift => (
            <button
              key={drift.id}
              onClick={() => handleDriftClick(drift)}
              className="w-full p-3 bg-gray-900/30 hover:bg-gray-800/30 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    drift.severity === 'high' ? 'bg-red-400' :
                    drift.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                  )} />
                  <span className="text-xs font-mono text-white">{drift.dataset}</span>
                </div>
                <span className="text-xs text-gray-400">{drift.detected}</span>
              </div>
              <div className="text-xs text-gray-300 mt-1">{drift.change}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Issue Triage */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Issue Triage</h3>
        <div className="space-y-2">
          {qualityIssues.map(issue => (
            <button
              key={issue.id}
              onClick={() => handleIssueClick(issue)}
              className="w-full p-3 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{issue.issue}</span>
                {issue.autoFixable && (
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                    Auto-fixable
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{issue.dataset}</span>
                <span className={getSeverityColor(issue.severity)}>{issue.affected}</span>
              </div>
              {issue.status === 'fixing' && (
                <div className="mt-2 text-xs text-blue-400">
                  🔧 Auto-remediation in progress...
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Remediation Progress */}
      <div className="flex-shrink-0 p-4 bg-gray-900/50 border-t border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Remediation Progress</h3>
        <div className="space-y-2">
          {remediationProgress.map((task, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{task.task}</span>
                <span className="text-gray-500">ETA: {task.eta}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-400 transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}