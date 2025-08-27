'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HomePaperProps {
  paperId: string;
  state: any;
  onSpawnPaper: (config: any) => void;
  onUpdateState: (updates: any) => void;
}

export function HomePaper({ onSpawnPaper }: HomePaperProps) {
  // Mock data for demonstration
  const criticalIssues = [
    {
      id: 'issue-1',
      title: 'Customer ETL Pipeline Failed',
      severity: 'critical',
      timestamp: '2 hours ago',
      impact: '12 downstream systems affected',
      confidence: 85
    },
    {
      id: 'issue-2',
      title: 'Schema Drift Detected',
      severity: 'high',
      timestamp: '4 hours ago',
      impact: 'Order processing pipeline',
      confidence: 92
    }
  ];
  
  const activeWork = [
    {
      id: 'work-1',
      title: 'Sales Dashboard v2',
      status: 'in_progress',
      progress: 65,
      nextStep: 'Quality validation'
    },
    {
      id: 'work-2',
      title: 'Inventory Optimization Model',
      status: 'pending_approval',
      progress: 90,
      nextStep: 'Production deployment'
    }
  ];
  
  const opportunities = [
    {
      id: 'opp-1',
      title: 'Cost Optimization: Reduce compute by 30%',
      type: 'optimization',
      savings: '$12,000/month',
      effort: 'Medium'
    },
    {
      id: 'opp-2',
      title: 'New Data Product: Customer 360',
      type: 'creation',
      value: 'High',
      effort: 'Large'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Status Banner */}
      <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">Production</span>
            </div>
            <div className="text-sm text-gray-400">
              <span className="text-white font-medium">3</span> active operations
            </div>
            <div className="text-sm text-gray-400">
              System health: <span className="text-green-500 font-medium">98%</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-xs bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors">
              AI Assistant
            </button>
            <div className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400 rounded">
              2 notifications
            </div>
          </div>
        </div>
      </div>
      
      {/* Priority Actions Grid */}
      <div className="flex-1 grid grid-cols-3 gap-6 p-6 overflow-y-auto">
        {/* Critical Issues Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-red-500">⚠</span> Critical Issues
          </h2>
          
          {criticalIssues.map((issue) => (
            <motion.div
              key={issue.id}
              className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-red-500/50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-white">{issue.title}</h3>
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded',
                  issue.severity === 'critical' 
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                )}>
                  {issue.severity}
                </span>
              </div>
              
              <div className="space-y-1 text-xs text-gray-400 mb-3">
                <div>{issue.timestamp}</div>
                <div>{issue.impact}</div>
                <div>AI confidence: {issue.confidence}%</div>
              </div>
              
              <button
                onClick={() => onSpawnPaper({
                  type: 'investigation',
                  title: `Investigating: ${issue.title}`,
                  componentKey: 'error-analysis',
                  initialState: { issueId: issue.id },
                  workflowId: `investigate-${issue.id}`
                })}
                className="w-full px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-medium transition-colors"
              >
                Investigate →
              </button>
            </motion.div>
          ))}
        </div>
        
        {/* Active Work Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-blue-500">⚡</span> Active Work
          </h2>
          
          {activeWork.map((work) => (
            <motion.div
              key={work.id}
              className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-blue-500/50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="text-sm font-medium text-white mb-2">{work.title}</h3>
              
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{work.status.replace('_', ' ')}</span>
                  <span>{work.progress}%</span>
                </div>
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${work.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-400 mb-3">
                Next: {work.nextStep}
              </div>
              
              <button
                onClick={() => onSpawnPaper({
                  type: 'development',
                  title: work.title,
                  componentKey: work.status === 'in_progress' 
                    ? 'model-development' 
                    : 'deployment-pipeline',
                  initialState: { workId: work.id },
                  workflowId: `work-${work.id}`
                })}
                className="w-full px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-xs font-medium transition-colors"
              >
                Continue →
              </button>
            </motion.div>
          ))}
        </div>
        
        {/* Opportunities Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-green-500">✨</span> Opportunities
          </h2>
          
          {opportunities.map((opp) => (
            <motion.div
              key={opp.id}
              className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500/50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="text-sm font-medium text-white mb-2">{opp.title}</h3>
              
              <div className="space-y-1 text-xs text-gray-400 mb-3">
                <div>Type: {opp.type}</div>
                {opp.savings && <div>Potential savings: {opp.savings}</div>}
                {opp.value && <div>Business value: {opp.value}</div>}
                <div>Effort: {opp.effort}</div>
              </div>
              
              <button
                onClick={() => onSpawnPaper({
                  type: opp.type === 'creation' ? 'development' : 'monitoring',
                  title: opp.title,
                  componentKey: opp.type === 'creation' 
                    ? 'product-definition'
                    : 'deployment-monitoring',
                  initialState: { opportunityId: opp.id },
                  workflowId: `opp-${opp.id}`
                })}
                className="w-full px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-xs font-medium transition-colors"
              >
                {opp.type === 'creation' ? 'Build →' : 'Optimize →'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* System Overview Strip */}
      <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {[
            { label: 'Connections', value: '42/45', status: 'healthy' },
            { label: 'CPU Usage', value: '68%', status: 'normal' },
            { label: 'Memory', value: '4.2 GB', status: 'normal' },
            { label: 'Recent Deploys', value: '3 today', status: 'healthy' },
            { label: 'Quality Score', value: '94%', status: 'healthy' }
          ].map((metric, index) => (
            <button
              key={index}
              onClick={() => onSpawnPaper({
                type: 'monitoring',
                title: `Monitoring: ${metric.label}`,
                componentKey: 'deployment-monitoring',
                initialState: { metric: metric.label }
              })}
              className="flex-shrink-0 px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              <div className="text-xs text-gray-400">{metric.label}</div>
              <div className="text-sm text-white font-medium">{metric.value}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}