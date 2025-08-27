'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useAIColumnAssistant } from '@/hooks/useAIColumnAssistant';

interface Pipeline {
  id: string;
  name: string;
  status: 'running' | 'failed' | 'completed' | 'queued';
  lastRun: string;
  duration: string;
  records: string;
  errors?: number;
  errorMessage?: string;
}

interface ResourceMetric {
  type: string;
  usage: number;
  limit: number;
  trend: 'up' | 'down' | 'stable';
}

export function PipelineOperations() {
  const { handleAICommand } = useAIColumnAssistant();
  
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: '1',
      name: 'Customer ETL',
      status: 'failed',
      lastRun: '5 min ago',
      duration: '12 min',
      records: '0',
      errors: 3,
      errorMessage: 'Schema validation failed: missing required field "email"'
    },
    {
      id: '2',
      name: 'Product Sync',
      status: 'running',
      lastRun: 'Now',
      duration: '3 min',
      records: '45K'
    },
    {
      id: '3',
      name: 'Sales Aggregation',
      status: 'completed',
      lastRun: '1 hour ago',
      duration: '28 min',
      records: '1.2M'
    },
    {
      id: '4',
      name: 'Inventory Update',
      status: 'queued',
      lastRun: '6 hours ago',
      duration: '-',
      records: '-'
    },
    {
      id: '5',
      name: 'Risk Calculator',
      status: 'failed',
      lastRun: '2 hours ago',
      duration: '45 min',
      records: '890K',
      errors: 1,
      errorMessage: 'Timeout: exceeded 45 minute limit'
    }
  ]);

  const [deploymentQueue] = useState([
    { name: 'Customer 360 v2.1', waitTime: '5 min', priority: 'high' },
    { name: 'Product Mapper v1.4', waitTime: '15 min', priority: 'medium' },
    { name: 'Sales Dashboard v3.0', waitTime: '25 min', priority: 'low' }
  ]);

  const [resources] = useState<ResourceMetric[]>([
    { type: 'CPU', usage: 78, limit: 100, trend: 'up' },
    { type: 'Memory', usage: 62, limit: 100, trend: 'stable' },
    { type: 'Storage', usage: 45, limit: 100, trend: 'up' }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelines(prev => prev.map(p => {
        if (p.status === 'running') {
          // Simulate progress
          const currentRecords = parseInt(p.records.replace('K', '000').replace('M', '000000') || '0');
          const newRecords = currentRecords + Math.floor(Math.random() * 10000);
          return {
            ...p,
            records: newRecords > 1000000 ? `${(newRecords / 1000000).toFixed(1)}M` : `${Math.floor(newRecords / 1000)}K`
          };
        }
        return p;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'queued': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '⚡';
      case 'completed': return '✓';
      case 'failed': return '✗';
      case 'queued': return '⏳';
      default: return '•';
    }
  };

  const handlePipelineClick = async (pipeline: Pipeline) => {
    if (pipeline.status === 'failed') {
      await handleAICommand({
        type: 'workflow',
        target: 'debug_pipeline',
        params: { pipelineId: pipeline.id, error: pipeline.errorMessage }
      });
    } else if (pipeline.status === 'running') {
      await handleAICommand({
        type: 'workflow',
        target: 'monitor_pipeline',
        params: { pipelineId: pipeline.id }
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-200">
      {/* Pipeline Status Header */}
      <div className="flex-shrink-0 p-4 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-300">Pipeline Status</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-green-400">✓ 12</span>
            <span className="text-blue-400">⚡ 3</span>
            <span className="text-red-400">✗ 2</span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Last refresh: 10 seconds ago
        </div>
      </div>

      {/* Active Pipelines */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {pipelines.map(pipeline => (
            <button
              key={pipeline.id}
              onClick={() => handlePipelineClick(pipeline)}
              className={cn(
                "w-full p-3 rounded-lg transition-all text-left",
                pipeline.status === 'failed' 
                  ? "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30" 
                  : "bg-gray-900/50 hover:bg-gray-800/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-lg", getStatusColor(pipeline.status))}>
                    {getStatusIcon(pipeline.status)}
                  </span>
                  <span className="font-medium text-white">{pipeline.name}</span>
                </div>
                <span className={cn("text-xs", getStatusColor(pipeline.status))}>
                  {pipeline.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{pipeline.lastRun}</span>
                <span>{pipeline.duration}</span>
                <span>{pipeline.records} records</span>
              </div>

              {pipeline.errors && (
                <div className="mt-2 p-2 bg-red-500/10 rounded text-xs">
                  <div className="text-red-400 mb-1">
                    Failed {pipeline.errors} times
                  </div>
                  <div className="text-gray-300 font-mono">
                    {pipeline.errorMessage}
                  </div>
                  <div className="text-red-400 mt-1">
                    → Click to investigate
                  </div>
                </div>
              )}

              {pipeline.status === 'running' && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 animate-pulse"
                      style={{ width: `${Math.random() * 60 + 20}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Deployment Queue */}
      <div className="flex-shrink-0 p-4 border-t border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Deployment Queue</h3>
        <div className="space-y-2">
          {deploymentQueue.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-900/30 rounded">
              <span className="text-xs text-gray-300">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs",
                  item.priority === 'high' ? 'text-red-400' :
                  item.priority === 'medium' ? 'text-yellow-400' : 'text-gray-400'
                )}>
                  {item.priority}
                </span>
                <span className="text-xs text-gray-500">~{item.waitTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Usage */}
      <div className="flex-shrink-0 p-4 bg-gray-900/50 border-t border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Resource Usage</h3>
        <div className="space-y-2">
          {resources.map(resource => (
            <div key={resource.type} className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{resource.type}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      resource.usage > 80 ? "bg-red-400" :
                      resource.usage > 60 ? "bg-yellow-400" : "bg-green-400"
                    )}
                    style={{ width: `${resource.usage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-10 text-right">
                  {resource.usage}%
                </span>
                <span className={cn(
                  "text-xs",
                  resource.trend === 'up' ? 'text-red-400' : 
                  resource.trend === 'down' ? 'text-green-400' : 'text-gray-400'
                )}>
                  {resource.trend === 'up' ? '↑' : resource.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}